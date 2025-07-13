// client/src/components/MobileOptimizedGame.tsx

import { useState } from 'react'
import RoleCard from './RoleCard'
import { DeadChat } from './DeadChat'

interface MobileOptimizedGameProps {
  // Game state
  roomCode: string
  currentDay: number
  currentPhase: string
  phaseMessage: string
  timeRemaining: number
  players: any[]
  myRole: string
  roleInfo: any
  playerName: string
  gameLog: string[]
  
  // Interaction state
  canVote: boolean
  canAct: boolean
  actionType: string
  selectedTarget: string
  setSelectedTarget: (target: string) => void
  
  // Actions
  castVote: () => void
  performNightAction: () => void
  formatTime: (ms: number) => string
}

export const MobileOptimizedGame: React.FC<MobileOptimizedGameProps> = ({
  roomCode,
  currentDay,
  currentPhase,
  phaseMessage,
  timeRemaining,
  players,
  myRole,
  roleInfo,
  playerName,
  gameLog,
  canVote,
  canAct,
  actionType,
  selectedTarget,
  setSelectedTarget,
  castVote,
  performNightAction,
  formatTime
}) => {
  const [activeTab, setActiveTab] = useState<'role' | 'players' | 'log' | 'action'>('role')
  const alivePlayers = players.filter(p => p.isAlive)
  const currentPlayer = players.find(p => p.name === playerName)
  const isAlive = currentPlayer?.isAlive !== false

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case 'night': return '🌙'
      case 'day': return '☀️'
      case 'voting': return '🗳️'
      default: return '🎮'
    }
  }

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'night': return 'from-indigo-900 to-purple-900'
      case 'day': return 'from-blue-500 to-cyan-500'
      case 'voting': return 'from-orange-500 to-red-500'
      default: return 'from-gray-700 to-gray-900'
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getPhaseColor()} text-white`}>
      {/* Mobile Header - Fixed at top */}
      <div className="sticky top-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="px-4 py-3">
          {/* Game Info Row */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getPhaseIcon()}</span>
              <div>
                <h1 className="text-lg font-bold">마피아 게임</h1>
                <p className="text-xs opacity-75">방 {roomCode} • {currentDay}일차</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold">{formatTime(timeRemaining)}</div>
              <p className="text-xs opacity-75">남은 시간</p>
            </div>
          </div>

          {/* Phase Message */}
          <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
            <p className="text-center text-sm font-medium">{phaseMessage}</p>
          </div>

          {/* Mobile Navigation Tabs */}
          <div className="flex space-x-1 bg-black bg-opacity-30 rounded-lg p-1">
            {[
              { id: 'role', label: '역할', icon: '👤' },
              { id: 'players', label: '플레이어', icon: '👥' },
              { id: 'action', label: '행동', icon: '⚡' },
              { id: 'log', label: '로그', icon: '📜' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-black shadow-md'
                    : 'text-white opacity-70'
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-sm">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Content Area */}
      <div className="px-4 py-4 pb-20">
        {/* Role Tab */}
        {activeTab === 'role' && (
          <div className="space-y-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-3 text-center">내 역할</h3>
              {myRole ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <RoleCard 
                      role={myRole} 
                      playerName={playerName}
                      isRevealed={true}
                      size="large"
                    />
                  </div>
                  <div className="bg-black bg-opacity-30 rounded-lg p-3">
                    <p className="text-sm text-center leading-relaxed">
                      {roleInfo?.description}
                    </p>
                  </div>
                  {roleInfo?.ability && (
                    <div className="bg-black bg-opacity-30 rounded-lg p-3">
                      <h4 className="font-medium mb-2 text-center">능력</h4>
                      <p className="text-sm text-center leading-relaxed">
                        {roleInfo.ability.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-white opacity-75">역할이 배정되지 않았습니다</p>
                </div>
              )}
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className={`text-2xl mb-1 ${isAlive ? 'text-green-400' : 'text-red-400'}`}>
                  {isAlive ? '💚' : '💀'}
                </div>
                <p className="text-xs font-medium">
                  {isAlive ? '생존' : '사망'}
                </p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">👥</div>
                <p className="text-xs font-medium">
                  {alivePlayers.length}명 생존
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-3 text-center">플레이어 목록</h3>
              <div className="space-y-2">
                {players.map(player => (
                  <div 
                    key={player.id} 
                    className={`p-3 rounded-lg transition-all ${
                      player.isAlive 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-red-900 bg-opacity-30'
                    } ${
                      player.name === playerName 
                        ? 'ring-2 ring-yellow-400' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          player.isAlive ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="font-medium">{player.name}</span>
                        {player.name === playerName && (
                          <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full">
                            나
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isHost && <span className="text-yellow-400">👑</span>}
                        {!player.isAlive && <span className="text-red-400">💀</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Tab */}
        {activeTab === 'action' && (
          <div className="space-y-4">
            {isAlive && (canVote || (canAct && actionType !== 'dummy')) ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-bold mb-4 text-center">
                  {canVote ? '🗳️ 투표하기' : '⚡ 밤 행동'}
                </h3>
                
                {/* Target Selection */}
                <div className="space-y-3 mb-6">
                  {alivePlayers.map(player => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedTarget(player.id)}
                      disabled={player.name === playerName}
                      className={`w-full p-4 rounded-lg font-medium transition-all ${
                        selectedTarget === player.id
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : player.name === playerName
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{player.name}</span>
                        {player.name === playerName && <span className="text-sm">(나)</span>}
                        {selectedTarget === player.id && <span>✓</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={canVote ? castVote : performNightAction}
                  disabled={!selectedTarget || selectedTarget === currentPlayer?.id}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl font-bold text-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform active:scale-95"
                >
                  {canVote ? '투표하기' : 
                   actionType === 'kill' ? '공격하기' :
                   actionType === 'heal' ? '치료하기' :
                   actionType === 'investigate' ? '조사하기' : '행동하기'}
                </button>
              </div>
            ) : isAlive && canAct && actionType === 'dummy' ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="font-bold mb-2">밤 대기 중</h3>
                  <p className="text-white opacity-75 mb-4">다른 플레이어들이 행동 중입니다...</p>
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                  </div>
                </div>
              </div>
            ) : !isAlive ? (
              <div className="bg-red-900 bg-opacity-50 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="py-8">
                  <div className="text-4xl mb-4">💀</div>
                  <h3 className="font-bold text-red-300 mb-2">사망</h3>
                  <p className="text-red-200">게임을 지켜보세요</p>
                </div>
              </div>
            ) : (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="py-8">
                  <div className="text-4xl mb-4">😴</div>
                  <h3 className="font-bold mb-2">대기 중</h3>
                  <p className="text-white opacity-75">현재 행동할 수 없습니다</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log Tab */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-bold mb-3 text-center">게임 로그</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gameLog.length > 0 ? gameLog.map((log, index) => (
                  <div 
                    key={index} 
                    className="bg-black bg-opacity-30 rounded-lg p-3"
                  >
                    <p className="text-sm leading-relaxed">{log}</p>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-white opacity-75">아직 게임 로그가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dead Chat - Fixed at bottom */}
      {!isAlive && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <DeadChat />
        </div>
      )}

      {/* Mobile-friendly floating action button for quick actions */}
      {isAlive && (canVote || canAct) && (
        <div className="fixed bottom-6 right-6 z-10">
          <button
            onClick={() => setActiveTab('action')}
            className={`w-14 h-14 rounded-full shadow-lg transition-all transform active:scale-95 ${
              activeTab === 'action' 
                ? 'bg-blue-500' 
                : 'bg-red-500 animate-pulse'
            }`}
          >
            <span className="text-2xl">
              {canVote ? '🗳️' : '⚡'}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}