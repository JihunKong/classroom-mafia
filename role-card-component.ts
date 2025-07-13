// client/src/components/game/RoleCard.tsx

import React from 'react';
import { Role } from '../../types/game.types';

interface RoleCardProps {
  role: Role;
  isRevealed?: boolean;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  onClick?: () => void;
}

// 역할별 이미지 경로 매핑
const roleImagePaths: Record<string, string> = {
  // 마피아 팀
  mafia: '/assets/images/roles/mafia-team/mafia.png',
  spy: '/assets/images/roles/mafia-team/spy.png',
  werewolf: '/assets/images/roles/mafia-team/werewolf.png',
  doubleAgent: '/assets/images/roles/mafia-team/double_agent.png',
  
  // 시민 팀
  citizen: '/assets/images/roles/citizen-team/citizen.png',
  police: '/assets/images/roles/citizen-team/police.png',
  doctor: '/assets/images/roles/citizen-team/doctor.png',
  soldier: '/assets/images/roles/citizen-team/soldier.png',
  reporter: '/assets/images/roles/citizen-team/reporter.png',
  detective: '/assets/images/roles/citizen-team/detective.png',
  bartender: '/assets/images/roles/citizen-team/bartender.png',
  cheerleader: '/assets/images/roles/citizen-team/cheerleader.png',
  wizard: '/assets/images/roles/citizen-team/wizard.png',
  medium: '/assets/images/roles/citizen-team/medium.png',
  thief: '/assets/images/roles/citizen-team/thief.png',
  
  // 중립 팀
  turncoat: '/assets/images/roles/neutral-team/turncoat.png',
  terrorist: '/assets/images/roles/neutral-team/terrorist.png',
  illusionist: '/assets/images/roles/neutral-team/illusionist.png',
  ghost: '/assets/images/roles/neutral-team/ghost.png',
};

// 팀별 색상 테마
const teamColors = {
  mafia: {
    background: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-900',
    glow: 'shadow-red-500/50'
  },
  citizen: {
    background: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-900',
    glow: 'shadow-blue-500/50'
  },
  neutral: {
    background: 'bg-purple-100',
    border: 'border-purple-500',
    text: 'text-purple-900',
    glow: 'shadow-purple-500/50'
  }
};

const sizeClasses = {
  small: {
    container: 'w-20 h-28',
    image: 'w-16 h-16',
    text: 'text-xs',
    padding: 'p-2'
  },
  medium: {
    container: 'w-32 h-44',
    image: 'w-24 h-24',
    text: 'text-sm',
    padding: 'p-3'
  },
  large: {
    container: 'w-48 h-64',
    image: 'w-36 h-36',
    text: 'text-base',
    padding: 'p-4'
  }
};

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isRevealed = true,
  size = 'medium',
  showDescription = false,
  onClick
}) => {
  const colors = teamColors[role.team];
  const sizes = sizeClasses[size];
  const imagePath = roleImagePaths[role.id];

  return (
    <div
      className={`
        ${sizes.container}
        ${sizes.padding}
        ${colors.background}
        ${colors.border}
        ${isRevealed ? '' : 'bg-gray-800'}
        border-2 rounded-lg
        flex flex-col items-center justify-between
        transition-all duration-300
        hover:scale-105
        ${isRevealed ? `hover:shadow-lg hover:${colors.glow}` : 'hover:shadow-gray-500/50'}
        ${onClick ? 'cursor-pointer' : ''}
        relative
        overflow-hidden
      `}
      onClick={onClick}
    >
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-10">
        {role.team === 'mafia' && (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-900" />
        )}
        {role.team === 'citizen' && (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-900" />
        )}
        {role.team === 'neutral' && (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-900" />
        )}
      </div>

      {/* 카드 내용 */}
      <div className="relative z-10 flex flex-col items-center">
        {isRevealed ? (
          <>
            {/* 역할 이미지 */}
            <div className={`${sizes.image} mb-2 relative`}>
              <img
                src={imagePath}
                alt={role.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 아이콘 표시
                  e.currentTarget.src = '/assets/images/roles/ui/default_role.png';
                }}
              />
              
              {/* 능력 아이콘 표시 */}
              {role.ability && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">⚡</span>
                </div>
              )}
            </div>

            {/* 역할 이름 */}
            <h3 className={`${sizes.text} font-bold ${colors.text} text-center`}>
              {role.name}
            </h3>

            {/* 팀 표시 */}
            <span className={`text-xs ${colors.text} opacity-75`}>
              {role.team === 'mafia' ? '마피아팀' : role.team === 'citizen' ? '시민팀' : '중립'}
            </span>

            {/* 설명 (옵션) */}
            {showDescription && size !== 'small' && (
              <p className={`mt-2 text-xs ${colors.text} text-center opacity-80 line-clamp-3`}>
                {role.description}
              </p>
            )}
          </>
        ) : (
          <>
            {/* 뒷면 (미공개 상태) */}
            <div className={`${sizes.image} mb-2 flex items-center justify-center`}>
              <div className="text-4xl">❓</div>
            </div>
            <h3 className={`${sizes.text} font-bold text-gray-300`}>
              ???
            </h3>
          </>
        )}
      </div>

      {/* 특수 효과 (선택 시) */}
      {onClick && isRevealed && (
        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300" />
      )}
    </div>
  );
};

// 역할 선택 그리드 컴포넌트
interface RoleGridProps {
  roles: Role[];
  selectedRoleId?: string;
  onRoleSelect?: (roleId: string) => void;
  showAll?: boolean;
}

export const RoleGrid: React.FC<RoleGridProps> = ({
  roles,
  selectedRoleId,
  onRoleSelect,
  showAll = true
}) => {
  const mafiaRoles = roles.filter(r => r.team === 'mafia');
  const citizenRoles = roles.filter(r => r.team === 'citizen');
  const neutralRoles = roles.filter(r => r.team === 'neutral');

  return (
    <div className="space-y-6">
      {/* 마피아 팀 */}
      {mafiaRoles.length > 0 && showAll && (
        <div>
          <h3 className="text-lg font-bold text-red-600 mb-3">마피아 팀</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {mafiaRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                size="medium"
                onClick={() => onRoleSelect?.(role.id)}
                isRevealed={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* 시민 팀 */}
      {citizenRoles.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-blue-600 mb-3">시민 팀</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {citizenRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                size="medium"
                onClick={() => onRoleSelect?.(role.id)}
                isRevealed={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* 중립 팀 */}
      {neutralRoles.length > 0 && showAll && (
        <div>
          <h3 className="text-lg font-bold text-purple-600 mb-3">중립/특수 역할</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {neutralRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                size="medium"
                onClick={() => onRoleSelect?.(role.id)}
                isRevealed={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};