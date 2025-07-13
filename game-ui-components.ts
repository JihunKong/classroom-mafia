// client/src/pages/Game.tsx - 게임 진행 화면에서 역할 이미지 사용 예시

import React from 'react';
import { RoleCard } from '../components/game/RoleCard';
import { useGame } from '../hooks/useGame';

export const Game: React.FC = () => {
  const { gameState, myRole, players } = useGame();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 바 - 내 역할 표시 */}
      <div className="bg-white shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold">내 역할</h2>
            {myRole && (
              <RoleCard 
                role={myRole} 
                size="small" 
                isRevealed={true}
              />
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

      {/* 플레이어 목록 */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4">플레이어 목록</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {players.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
};

// 플레이어 카드 컴포넌트
interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    isAlive: boolean;
    role?: Role; // 죽은 후 공개되거나 특수 능력으로 알게 된 경우
  };
  onSelect?: () => void;
  isSelectable?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onSelect, isSelectable }) => {
  return (
    <div
      className={`
        relative rounded-lg border-2 p-3
        ${player.isAlive ? 'border-gray-300 bg-white' : 'border-red-500 bg-red-50'}
        ${isSelectable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        transition-all duration-200
      `}
      onClick={isSelectable ? onSelect : undefined}
    >
      {/* 사망 표시 */}
      {!player.isAlive && (
        <div className="absolute top-1 right-1">
          <img 
            src="/assets/images/roles/ui/death_icon.png" 
            alt="사망" 
            className="w-6 h-6"
          />
        </div>
      )}

      {/* 플레이어 역할 이미지 (알고 있는 경우) */}
      <div className="flex flex-col items-center">
        {player.role ? (
          <RoleCard
            role={player.role}
            size="small"
            isRevealed={true}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl text-gray-500">?</span>
          </div>
        )}
        
        {/* 플레이어 이름 */}
        <span className={`text-sm font-medium ${player.isAlive ? 'text-gray-900' : 'text-red-600 line-through'}`}>
          {player.name}
        </span>
      </div>
    </div>
  );
};

// 역할 공개 모달 컴포넌트
interface RoleRevealModalProps {
  role: Role;
  onClose: () => void;
}

export const RoleRevealModal: React.FC<RoleRevealModalProps> = ({ role, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full animate-scale-in">
        <h2 className="text-2xl font-bold text-center mb-4">당신의 역할</h2>
        
        <div className="flex justify-center mb-4">
          <RoleCard 
            role={role} 
            size="large" 
            isRevealed={true}
            showDescription={true}
          />
        </div>

        {/* 능력 설명 */}
        {role.ability && (
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-sm mb-2">특수 능력</h3>
            <p className="text-sm text-gray-700">{role.ability.description}</p>
          </div>
        )}

        {/* 팀 목표 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-sm mb-2">승리 조건</h3>
          <p className="text-sm text-gray-700">
            {role.team === 'mafia' 
              ? '마피아 수가 시민 수 이상이 되면 승리합니다.' 
              : role.team === 'citizen'
              ? '모든 마피아를 제거하면 승리합니다.'
              : '특수 승리 조건을 달성하세요.'}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
};

// 투표 화면에서 역할 아이콘 표시
export const VotingScreen: React.FC = () => {
  const { players, handleVote } = useGame();
  const alivePlayers = players.filter(p => p.isAlive);

  return (
    <div className="p-4">
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <img 
            src="/assets/images/roles/ui/vote_icon.png" 
            alt="투표" 
            className="w-8 h-8"
          />
          <h2 className="text-lg font-bold">마피아로 의심되는 사람을 지목하세요</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {alivePlayers.map(player => (
          <button
            key={player.id}
            onClick={() => handleVote(player.id)}
            className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-red-500 hover:shadow-lg transition-all"
          >
            <PlayerCard player={player} />
            <div className="mt-2 bg-red-600 text-white py-1 px-3 rounded-full text-sm">
              지목하기
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};