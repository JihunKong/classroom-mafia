// server/src/socket/deadChatHandlers.ts

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { DeadChatMessage } from '../shared/types';
// import { sanitizePlayerName } from '../shared/constants/security';

// 방별 데드챗 메시지 저장
const deadChatMessages: Map<string, DeadChatMessage[]> = new Map();

export const handleDeadChatEvents = (io: Server, socket: Socket) => {
  
  // 데드챗 메시지 전송
  socket.on('deadChat:send', async (data: { message: string }) => {
    try {
      const roomCode = (socket as any).roomCode;
      const player = (socket as any).player;
      
      if (!roomCode || !player) {
        socket.emit('error', { message: '방 정보를 찾을 수 없습니다.' });
        return;
      }

      // 살아있는 플레이어는 데드챗 사용 불가
      if (player.isAlive) {
        socket.emit('error', { message: '살아있는 플레이어는 데드챗을 사용할 수 없습니다.' });
        return;
      }

      // 메시지 유효성 검사 및 정화
      let sanitizedMessage;
      try {
        sanitizedMessage = data.message.trim().substring(0, 500); // Simple message sanitization
      } catch (validationError) {
        socket.emit('error', { message: `메시지 오류: ${(validationError as Error).message}` });
        return;
      }

      // 메시지 생성
      const newMessage: DeadChatMessage = {
        id: uuidv4(),
        roomCode,
        playerId: player.id,
        playerName: player.name,
        message: sanitizedMessage,
        timestamp: new Date(),
        role: {
          id: player.role,
          name: player.roleInfo?.name || player.role,
          team: player.roleInfo?.team || 'citizen'
        }
      };

      // 메시지 저장
      if (!deadChatMessages.has(roomCode)) {
        deadChatMessages.set(roomCode, []);
      }
      deadChatMessages.get(roomCode)!.push(newMessage);

      // 같은 방의 모든 죽은 플레이어에게 전송
      const room = io.sockets.adapter.rooms.get(roomCode);
      if (room) {
        for (const socketId of room) {
          const targetSocket = io.sockets.sockets.get(socketId);
          if (targetSocket && !(targetSocket as any).player.isAlive) {
            targetSocket.emit('deadChat:message', newMessage);
          }
        }
      }

    } catch (error) {
      console.error('데드챗 메시지 전송 오류:', error);
      socket.emit('error', { message: '메시지 전송에 실패했습니다.' });
    }
  });

  // 데드챗 히스토리 요청
  socket.on('deadChat:getHistory', () => {
    const roomCode = (socket as any).roomCode;
    const player = (socket as any).player;

    if (!roomCode || !player || player.isAlive) {
      return;
    }

    const messages = deadChatMessages.get(roomCode) || [];
    socket.emit('deadChat:history', messages);
  });

  // 플레이어 사망 시 데드챗 참여 알림
  socket.on('player:died', (playerId: string) => {
    const roomCode = (socket as any).roomCode;
    if (!roomCode) return;

    // 방의 모든 죽은 플레이어에게 새로운 참여자 알림
    const room = io.sockets.adapter.rooms.get(roomCode);
    if (room) {
      for (const socketId of room) {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket && !(targetSocket as any).player.isAlive) {
          targetSocket.emit('deadChat:playerJoined', {
            playerId,
            playerName: (socket as any).player.name,
            role: (socket as any).player.role
          });
        }
      }
    }

    // 시스템 메시지 추가
    const systemMessage: DeadChatMessage = {
      id: uuidv4(),
      roomCode,
      playerId: 'system',
      playerName: '시스템',
      message: `${(socket as any).player.name}님이 사망하여 데드챗에 참여했습니다.`,
      timestamp: new Date(),
      role: { id: 'system', name: '시스템', team: 'neutral' }
    };

    if (!deadChatMessages.has(roomCode)) {
      deadChatMessages.set(roomCode, []);
    }
    deadChatMessages.get(roomCode)!.push(systemMessage);

    // 시스템 메시지 전송
    if (room) {
      for (const socketId of room) {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket && !(targetSocket as any).player.isAlive) {
          targetSocket.emit('deadChat:message', systemMessage);
        }
      }
    }
  });

  // 방 정리
  socket.on('room:cleanup', (roomCode: string) => {
    deadChatMessages.delete(roomCode);
  });
};

// 플레이어 사망 처리 시 호출할 함수
export const notifyPlayerDeath = (io: Server, roomCode: string, player: any) => {
  // 사망한 플레이어에게 데드챗 활성화 알림
  const playerSocket = [...io.sockets.sockets.values()]
    .find(s => (s as any).player?.id === player.id);
  
  if (playerSocket) {
    playerSocket.emit('deadChat:activated', {
      message: '이제 데드챗에 참여할 수 있습니다.'
    });
    
    // 기존 데드챗 히스토리 전송
    const messages = deadChatMessages.get(roomCode) || [];
    playerSocket.emit('deadChat:history', messages);
  }

  // 다른 죽은 플레이어들에게 새 참여자 알림
  const room = io.sockets.adapter.rooms.get(roomCode);
  if (room) {
    const systemMessage: DeadChatMessage = {
      id: uuidv4(),
      roomCode,
      playerId: 'system',
      playerName: '시스템',
      message: `${player.name}(${player.roleInfo?.name || player.role})님이 데드챗에 참여했습니다.`,
      timestamp: new Date(),
      role: { id: 'system', name: '시스템', team: 'neutral' }
    };

    if (!deadChatMessages.has(roomCode)) {
      deadChatMessages.set(roomCode, []);
    }
    deadChatMessages.get(roomCode)!.push(systemMessage);

    for (const socketId of room) {
      const targetSocket = io.sockets.sockets.get(socketId);
      if (targetSocket && !(targetSocket as any).player.isAlive && (targetSocket as any).player.id !== player.id) {
        targetSocket.emit('deadChat:message', systemMessage);
      }
    }
  }
};

// 게임 종료 시 데드챗을 전체 공개 채팅으로 전환
export const openDeadChatToAll = (io: Server, roomCode: string) => {
  const room = io.sockets.adapter.rooms.get(roomCode);
  if (!room) return;

  // 모든 플레이어에게 데드챗 히스토리 공개
  const messages = deadChatMessages.get(roomCode) || [];
  
  io.to(roomCode).emit('deadChat:revealed', {
    messages,
    notification: '게임이 종료되어 데드챗이 모든 플레이어에게 공개됩니다.'
  });
};