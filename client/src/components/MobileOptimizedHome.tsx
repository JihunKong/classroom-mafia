// client/src/components/MobileOptimizedHome.tsx

import { useState } from 'react'
import { TTSSettings } from './TTSSettings'

interface MobileOptimizedHomeProps {
  playerName: string
  setPlayerName: (name: string) => void
  roomCode: string
  setRoomCode: (code: string) => void
  isConnected: boolean
  createRoom: () => void
  joinRoom: () => void
}

export const MobileOptimizedHome: React.FC<MobileOptimizedHomeProps> = ({
  playerName,
  setPlayerName,
  roomCode,
  setRoomCode,
  isConnected,
  createRoom,
  joinRoom
}) => {
  const [showTTSSettings, setShowTTSSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="pt-safe-top px-6 pt-8 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🎭</h1>
            <h2 className="text-xl font-bold text-white">한국형 마피아</h2>
            <p className="text-blue-200 text-sm">실시간 멀티플레이어 게임</p>
          </div>
          <button
            onClick={() => setShowTTSSettings(true)}
            className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-full text-white hover:bg-opacity-30 transition-all"
            title="음성 설정"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-6 mb-6">
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          isConnected 
            ? 'bg-green-500 bg-opacity-20 border border-green-400'
            : 'bg-red-500 bg-opacity-20 border border-red-400'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
          }`}></div>
          <span className="text-white text-sm font-medium">
            {isConnected ? '서버 연결됨' : '서버 연결 안됨'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          {/* Player Name Input */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">플레이어 이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full p-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-opacity-30 transition-all text-lg"
              maxLength={20}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Create Room */}
            <button
              onClick={createRoom}
              disabled={!playerName || !isConnected}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl font-bold text-lg disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>🏠</span>
                <span>새 게임 만들기</span>
              </div>
              <p className="text-xs opacity-80 mt-1">6-20명</p>
            </button>

            {/* Join Room */}
            <div className="space-y-3">
              <label className="block text-white font-medium">게임 참여</label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="코드"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 p-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-green-400 focus:bg-opacity-30 transition-all text-lg text-center font-mono"
                />
                <button
                  onClick={joinRoom}
                  disabled={!playerName || !roomCode || !isConnected}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-bold disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
                >
                  참여
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Game Features */}
      <div className="px-6 pb-safe-bottom pb-6">
        <div className="bg-black bg-opacity-20 rounded-xl p-4">
          <h3 className="text-white font-medium mb-3 text-center">게임 특징</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="space-y-1">
              <div className="text-2xl">🎭</div>
              <p className="text-xs text-white opacity-75">18가지 역할</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">🔊</div>
              <p className="text-xs text-white opacity-75">음성 안내</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">👥</div>
              <p className="text-xs text-white opacity-75">실시간 채팅</p>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">📱</div>
              <p className="text-xs text-white opacity-75">모바일 최적화</p>
            </div>
          </div>
        </div>
      </div>

      {/* TTS Settings Modal */}
      {showTTSSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowTTSSettings(false)}></div>
          <div className="relative">
            <TTSSettings onClose={() => setShowTTSSettings(false)} />
          </div>
        </div>
      )}
    </div>
  )
}