// client/src/components/DeadChat.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../hooks/useGame';
import { DeadChatMessage } from '../../../shared/types';

export const DeadChat: React.FC = () => {
  const { socket } = useSocket();
  const { myPlayer } = useGame();
  const [messages, setMessages] = useState<DeadChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 메시지 수신
  useEffect(() => {
    if (!socket) return;

    socket.on('deadChat:message', (message: DeadChatMessage) => {
      setMessages(prev => [...prev, message]);
      
      // 최소화 상태일 때 읽지 않은 메시지 카운트 증가
      if (isMinimized) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('deadChat:history', (history: DeadChatMessage[]) => {
      setMessages(history);
    });

    socket.on('deadChat:activated', () => {
      // 사망 시 데드챗 히스토리 요청
      ;socket.emit('deadChat:getHistory');
    });

    return () => {
      socket.off('deadChat:message');
      socket.off('deadChat:history');
      socket.off('deadChat:activated');
    };
  }, [socket, isMinimized]);

  // 자동 스크롤
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // 최소화 해제 시 읽지 않은 메시지 초기화
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

  // 메시지 전송
  const sendMessage = () => {
    if (!inputMessage.trim() || !socket || !myPlayer) return;

    socket.emit('deadChat:send', {
      message: inputMessage.trim()
    });

    setInputMessage('');
  };

  // 엔터키로 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 죽은 후 채팅 내역 요청
  useEffect(() => {
    if (myPlayer && !myPlayer.isAlive && socket) {
      socket.emit('deadChat:getHistory');
    }
  }, [myPlayer?.isAlive, socket]);

  // 살아있는 플레이어는 데드챗 접근 불가
  if (!myPlayer || myPlayer.isAlive) {
    return null;
  }

  // 팀 색상 가져오기
  const getTeamColor = (team?: string) => {
    switch (team) {
      case 'mafia': return 'text-red-600';
      case 'citizen': return 'text-blue-600';
      case 'neutral': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      {/* 최소화된 상태 */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        >
          <div className="relative">
            <span className="text-2xl">👻</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </button>
      )}

      {/* 채팅 창 */}
      {!isMinimized && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-gray-900 rounded-lg shadow-xl z-40 flex flex-col">
          {/* 헤더 */}
          <div className="bg-gray-800 p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👻</span>
              <h3 className="text-white font-bold">사망자 채팅</h3>
              <span className="text-gray-400 text-sm">
                ({messages.length}개 메시지)
              </span>
            </div>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-gray-700 px-3 py-2 text-xs text-gray-300">
            💀 사망한 플레이어끼리만 대화할 수 있습니다. 역할이 공개됩니다.
          </div>

          {/* 메시지 영역 */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-900"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                아직 메시지가 없습니다.
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.playerId === myPlayer?.id ? 'ml-auto' : 'mr-auto'
                } max-w-[85%]`}
              >
                <div className="text-xs text-gray-400 mb-1 flex items-center space-x-1">
                  <span>{msg.playerName}</span>
                  {msg.role && (
                    <>
                      <span>•</span>
                      <span className={getTeamColor(msg.role.team)}>
                        {msg.role.name}
                      </span>
                    </>
                  )}
                </div>
                <div
                  className={`p-2 rounded-lg ${
                    msg.playerId === myPlayer?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-3 bg-gray-800 rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={500}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 데드챗 참여자 목록 컴포넌트
export const DeadChatParticipants: React.FC = () => {
  const { players } = useGame();
  const deadPlayers = players.filter(p => !p.isAlive);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-white font-bold mb-3 flex items-center space-x-2">
        <span className="text-xl">👻</span>
        <span>사망자 목록 ({deadPlayers.length}명)</span>
      </h4>
      
      <div className="space-y-2">
        {deadPlayers.map(player => (
          <div key={player.id} className="flex items-center space-x-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-xs">💀</span>
            </div>
            <div>
              <span className="text-gray-300">{player.name}</span>
              <span className={`ml-2 text-xs ${
                player.roleInfo?.team === 'mafia' ? 'text-red-400' :
                player.roleInfo?.team === 'citizen' ? 'text-blue-400' :
                'text-purple-400'
              }`}>
                {player.roleInfo?.name || player.role}
              </span>
            </div>
          </div>
        ))}
        
        {deadPlayers.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-4">
            아직 사망한 플레이어가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};