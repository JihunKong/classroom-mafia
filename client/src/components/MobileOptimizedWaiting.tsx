// client/src/components/MobileOptimizedWaiting.tsx

interface MobileOptimizedWaitingProps {
  roomCode: string
  players: any[]
  playerName: string
  startGame: () => void
}

export const MobileOptimizedWaiting: React.FC<MobileOptimizedWaitingProps> = ({
  roomCode,
  players,
  playerName,
  startGame
}) => {
  const hostPlayer = players.find(p => p.isHost)
  const isHost = hostPlayer?.name === playerName
  const canStart = players.length >= 6 && isHost

  const getPlayerCountColor = () => {
    if (players.length < 6) return 'text-red-400'
    if (players.length <= 10) return 'text-green-400'
    if (players.length <= 15) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const getPlayerCountIcon = () => {
    if (players.length < 6) return '⚠️'
    if (players.length <= 10) return '✅'
    if (players.length <= 15) return '⚡'
    return '🔥'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      {/* Header */}
      <div className="pt-safe-top px-6 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">🎭 대기실</h1>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white text-sm mb-1">참여 코드</p>
            <div className="text-4xl font-mono font-bold text-white tracking-wider">
              {roomCode}
            </div>
            <p className="text-white text-xs opacity-75 mt-1">
              친구들에게 이 코드를 알려주세요
            </p>
          </div>
        </div>
      </div>

      {/* Player Count Status */}
      <div className="px-6 mb-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{getPlayerCountIcon()}</span>
              <div>
                <p className="text-white font-medium">플레이어</p>
                <p className={`text-2xl font-bold ${getPlayerCountColor()}`}>
                  {players.length}/20
                </p>
              </div>
            </div>
            <div className="text-right">
              {players.length < 6 ? (
                <div>
                  <p className="text-red-300 text-sm font-medium">최소 6명 필요</p>
                  <p className="text-red-400 text-xs">
                    {6 - players.length}명 더 기다리는 중...
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-green-300 text-sm font-medium">게임 시작 가능!</p>
                  <p className="text-green-400 text-xs">
                    {isHost ? '시작 버튼을 누르세요' : '호스트가 시작하기를 기다리는 중...'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  players.length < 6 ? 'bg-red-400' :
                  players.length <= 10 ? 'bg-green-400' :
                  players.length <= 15 ? 'bg-yellow-400' : 'bg-orange-400'
                }`}
                style={{ width: `${Math.min((players.length / 20) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="flex-1 px-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 h-full">
          <h3 className="text-white font-bold mb-4 text-center">참가자 목록</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {players.map((player, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg transition-all ${
                  player.name === playerName 
                    ? 'bg-blue-500 bg-opacity-50 ring-2 ring-blue-400' 
                    : 'bg-white bg-opacity-20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      player.isHost ? 'bg-yellow-500' : 'bg-gray-600'
                    }`}>
                      {player.isHost ? '👑' : (index + 1)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{player.name}</p>
                      <p className="text-xs text-white opacity-75">
                        {player.isHost ? '방장' : '플레이어'}
                        {player.name === playerName && ' (나)'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty slots indication */}
            {players.length < 20 && (
              <div className="space-y-2">
                {Array.from({ length: Math.min(4, 20 - players.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="p-3 rounded-lg bg-white bg-opacity-5 border-2 border-dashed border-white border-opacity-20">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 bg-opacity-50 flex items-center justify-center">
                        <span className="text-gray-400">?</span>
                      </div>
                      <p className="text-gray-400 text-sm">플레이어 대기 중...</p>
                    </div>
                  </div>
                ))}
                {players.length < 16 && (
                  <div className="text-center py-2">
                    <p className="text-white opacity-50 text-xs">
                      최대 {20 - players.length}명 더 참여 가능
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 py-6 pb-safe-bottom">
        {canStart ? (
          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🚀</span>
              <span>게임 시작하기</span>
            </div>
          </button>
        ) : !isHost ? (
          <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span>⏳</span>
              <span className="text-yellow-200 font-medium">방장이 게임을 시작하기를 기다리는 중...</span>
            </div>
            <p className="text-yellow-300 text-sm">
              방장: {hostPlayer?.name}
            </p>
          </div>
        ) : (
          <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span>⚠️</span>
              <span className="text-red-200 font-medium">최소 6명의 플레이어가 필요합니다</span>
            </div>
            <p className="text-red-300 text-sm">
              {6 - players.length}명 더 필요
            </p>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="px-6 pb-4">
        <div className="bg-black bg-opacity-20 rounded-xl p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-white text-xs opacity-75">최소 인원</p>
              <p className="text-white font-bold">6명</p>
            </div>
            <div>
              <p className="text-white text-xs opacity-75">권장 인원</p>
              <p className="text-white font-bold">8-12명</p>
            </div>
            <div>
              <p className="text-white text-xs opacity-75">최대 인원</p>
              <p className="text-white font-bold">20명</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}