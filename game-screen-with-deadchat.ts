// client/src/pages/Game.tsx - 데드챗이 통합된 게임 화면

import React, { useState } from 'react';
import { RoleCard } from '../components/game/RoleCard';
import { DeadChat, DeadChatParticipants } from '../components/game/DeadChat';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';

export const Game: React.FC = () => {
  const { gameState, myRole, myPlayer, players } = useGame();
  const { socket } = useSocket();
  const [showDeadList, setShowDeadList] = useState(false);

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 바 - 내 역할 및 상태 표시 */}
      <div className="bg-white shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold">내 역할</h2>
            {myRole && (
              <div className="flex items-center space-x-2">
                <RoleCard 
                  role={myRole} 
                  size="small" 
                  isRevealed={true}
                />
                {!myPlayer?.isAlive && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    사망
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* 게임 페이즈 표시 */}
          <div className="flex items-center space-x-2">
            <img 
              src={gameState.phase === 'night' ? '/assets/images/roles/ui/night_phase.png' : '/assets/images/roles/ui/day_phase.png'}
              alt={gameState.phase}
              className="w-8 h-8"
            />
            <span className="font-medium">
              {gameState.phase === 'night' ? '밤' : '낮'} {gameState.round}일차
            </span>
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div className="p-4">
        {/* 생존자/사망자 탭 */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setShowDeadList(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showDeadList 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            생존자 ({alivePlayers.length}명)
          </button>
          <button
            onClick={() => setShowDeadList(true)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showDeadList 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            사망자 ({deadPlayers.length}명)
          </button>
        </div>

        {/* 플레이어 목록 */}
        {!showDeadList ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {alivePlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <DeadPlayersList players={deadPlayers} />
        )}

        {/* 게임 상태 정보 */}
        <GameStatusInfo 
          gameState={gameState} 
          myPlayer={myPlayer}
          alivePlayers={alivePlayers}
        />
      </div>

      {/* 데드챗 - 사망한 플레이어만 표시 */}
      {!myPlayer?.isAlive && <DeadChat />}

      {/* 게임 종료 후 데드챗 공개 */}
      {gameState.phase === 'ended' && <DeadChatReveal />}
    </div>
  );
};

// 사망자 목록 컴포넌트
const DeadPlayersList: React.FC<{ players: any[] }> = ({ players }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
          <img 
            src="/assets/images/roles/ui/death_icon.png" 
            alt="사망" 
            className="w-6 h-6"
          />
          <span>사망자 목록</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {players.map(player => (
            <div 
              key={player.id} 
              className="bg-gray-700 rounded-lg p-3 flex items-center space-x-3"
            >
              <RoleCard
                role={player.role}
                size="small"
                isRevealed={true}
              />
              <div className="flex-1">
                <p className="text-white font-medium">{player.name}</p>
                <p className="text-gray-400 text-sm">
                  {player.deathRound 
                    ? `${player.deathRound}일차 사망` 
                    : '사망'}
                </p>
                <p className={`text-xs ${
                  player.role.team === 'mafia' ? 'text-red-400' :
                  player.role.team === 'citizen' ? 'text-blue-400' :
                  'text-purple-400'
                }`}>
                  {player.role.name}
                </p>
              </div>
              {player.killedBy && (
                <div className="text-xs text-gray-500">
                  {player.killedBy === 'mafia' ? '🔫' : '⚖️'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 게임 상태 정보 컴포넌트
const GameStatusInfo: React.FC<{ 
  gameState: any; 
  myPlayer: any;
  alivePlayers: any[];
}> = ({ gameState, myPlayer, alivePlayers }) => {
  const mafiaCount = alivePlayers.filter(p => p.role?.team === 'mafia').length;
  const citizenCount = alivePlayers.filter(p => p.role?.team === 'citizen').length;
  
  return (
    <div className="mt-6 bg-white rounded-lg p-4 shadow">
      {/* 팀 현황 (사망자만 보거나 게임 종료 시) */}
      {(!myPlayer?.isAlive || gameState.phase === 'ended') && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-blue-600 font-bold text-2xl">{citizenCount}</p>
            <p className="text-blue-600 text-sm">시민팀</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-red-600 font-bold text-2xl">{mafiaCount}</p>
            <p className="text-red-600 text-sm">마피아팀</p>
          </div>
        </div>
      )}

      {/* 현재 페이즈 정보 */}
      <div className="text-center">
        <p className="text-gray-600 text-sm mb-2">현재 단계</p>
        <p className="text-lg font-bold">
          {getPhaseDescription(gameState.phase)}
        </p>
        {gameState.timeLeft > 0 && (
          <p className="text-2xl font-mono mt-2 text-blue-600">
            {Math.floor(gameState.timeLeft / 60)}:
            {(gameState.timeLeft % 60).toString().padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  );
};

// 게임 종료 후 데드챗 공개
const DeadChatReveal: React.FC = () => {
  const [showReveal, setShowReveal] = useState(false);
  const [revealedMessages, setRevealedMessages] = useState<any[]>([]);

  React.useEffect(() => {
    const { socket } = useSocket();
    if (!socket) return;

    socket.on('deadChat:revealed', ({ messages }) => {
      setRevealedMessages(messages);
      setShowReveal(true);
    });

    return () => {
      socket.off('deadChat:revealed');
    };
  }, []);

  if (!showReveal || revealedMessages.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <img 
            src="/assets/images/roles/ui/ghost.png" 
            alt="데드챗" 
            className="w-8 h-8"
          />
          <span>데드챗 공개</span>
        </h2>
        
        <div className="flex-1 overflow-y-auto bg-gray-100 rounded-lg p-4 space-y-3">
          {revealedMessages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{msg.playerName}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  msg.role.team === 'mafia' ? 'bg-red-100 text-red-600' :
                  msg.role.team === 'citizen' ? 'bg-blue-100 text-blue-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {msg.role.name}
                </span>
              </div>
              <p className="text-gray-700">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleString('ko-KR')}
              </p>
            </div>
          ))}
        </div>
        
        <button
          onClick={() => setShowReveal(false)}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

// 페이즈 설명 헬퍼 함수
const getPhaseDescription = (phase: string): string => {
  const descriptions: Record<string, string> = {
    waiting: '대기 중',
    starting: '게임 시작',
    day: '토론 시간',
    voting: '투표 시간',
    execution: '처형 투표',
    night: '밤 시간',
    nightResult: '밤 결과',
    ended: '게임 종료'
  };
  return descriptions[phase] || phase;
};

// 플레이어 카드 컴포넌트
const PlayerCard: React.FC<{ player: any; onSelect?: () => void }> = ({ player, onSelect }) => {
  return (
    <div
      className={`
        relative rounded-lg border-2 p-3
        ${player.isAlive ? 'border-gray-300 bg-white' : 'border-red-500 bg-red-50'}
        ${onSelect ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        transition-all duration-200
      `}
      onClick={onSelect}
    >
      {!player.isAlive && (
        <div className="absolute top-1 right-1">
          <img 
            src="/assets/images/roles/ui/death_icon.png" 
            alt="사망" 
            className="w-6 h-6"
          />
        </div>
      )}

      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
          <span className="text-2xl font-bold text-gray-500">
            {player.name[0].toUpperCase()}
          </span>
        </div>
        
        <span className={`text-sm font-medium ${player.isAlive ? 'text-gray-900' : 'text-red-600 line-through'}`}>
          {player.name}
        </span>
      </div>
    </div>
  );
};