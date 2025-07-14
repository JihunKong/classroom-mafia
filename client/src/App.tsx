import { useState, useEffect, useRef } from 'react'
import RoleCard from './components/RoleCard'
import { TTSSettings } from './components/TTSSettings'
import { DeadChat } from './components/DeadChat'
import { MobileOptimizedGame } from './components/MobileOptimizedGame'
import { MobileOptimizedHome } from './components/MobileOptimizedHome'
import { MobileOptimizedWaiting } from './components/MobileOptimizedWaiting'
import { PWAInstaller } from './components/PWAInstaller'
import { useSocket } from './hooks/useSocket'
import { useGame } from './hooks/useGame'
import { useResponsive } from './hooks/useResponsive'
import { Player } from '../../shared/types/game'

function App() {
  // Game hooks
  const { socket, isConnected } = useSocket()
  const { 
    roomCode, setRoomCode, 
    players, setPlayers, 
    setMyPlayer,
    gameState, setGameState,
    currentPhase, setCurrentPhase,
    currentDay, setCurrentDay,
    timeRemaining, setTimeRemaining,
    phaseMessage, setPhaseMessage,
    gameLog, setGameLog,
    winner, setWinner
  } = useGame()

  // Responsive design hook
  const { isMobile } = useResponsive()
  
  // Local state (keeping existing functionality)
  const [playerName, setPlayerName] = useState('')
  const [showTTSSettings, setShowTTSSettings] = useState(false)
  const roomCodeRef = useRef<string>('')
  const timerRef = useRef<number | null>(null)
  
  // Game state (local only)
  const [myRole, setMyRole] = useState<string>('')
  const [roleInfo, setRoleInfo] = useState<any>(null)
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [canVote, setCanVote] = useState<boolean>(false)
  const [canAct, setCanAct] = useState<boolean>(false)
  const [actionType, setActionType] = useState<string>('')
  
  // Network state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState<boolean>(false)

  // Offline notification overlay component
  const OfflineNotification = () => {
    if (!showOfflineMessage || isOnline) return null
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">오프라인 모드</h2>
          <p className="text-gray-600 mb-4">
            인터넷 연결이 끊어졌습니다.<br />
            연결이 복구되면 자동으로 게임이 재개됩니다.
          </p>
          <div className="animate-pulse bg-gray-200 h-2 rounded mb-4"></div>
          <p className="text-sm text-gray-500">연결 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // TTS 함수
  const speak = (text: string, rateOverride?: number, pitchOverride?: number) => {
    if ('speechSynthesis' in window) {
      // 이전 음성 중단
      window.speechSynthesis.cancel()
      
      // 저장된 설정 불러오기
      const savedVoice = localStorage.getItem('tts-voice')
      const savedRate = localStorage.getItem('tts-rate')
      const savedPitch = localStorage.getItem('tts-pitch')
      const savedVolume = localStorage.getItem('tts-volume')
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ko-KR' // 한국어 설정
      utterance.rate = rateOverride || (savedRate ? parseFloat(savedRate) : 0.9)
      utterance.pitch = pitchOverride || (savedPitch ? parseFloat(savedPitch) : 1.0)
      utterance.volume = savedVolume ? parseFloat(savedVolume) : 0.9
      
      // 사용 가능한 음성 중 한국어 음성 찾기
      const voices = window.speechSynthesis.getVoices()
      const koreanVoices = voices.filter(voice => voice.lang.includes('ko'))
      
      if (savedVoice) {
        // 저장된 음성 사용
        const voice = voices.find(v => v.name === savedVoice)
        if (voice) {
          utterance.voice = voice
        }
      } else {
        // 기본 우선순위 음성 선택
        const preferredVoices = koreanVoices.filter(voice => 
          voice.name.includes('Heami') || // Microsoft Heami (Windows)
          voice.name.includes('Yuna') || // Google Yuna
          voice.name.includes('Google') ||
          voice.name.includes('Microsoft') ||
          voice.name.includes('Premium') ||
          voice.name.includes('Natural') // Edge 브라우저의 자연스러운 음성
        )
        
        if (preferredVoices.length > 0) {
          utterance.voice = preferredVoices[0]
        } else if (koreanVoices.length > 0) {
          utterance.voice = koreanVoices[0]
        }
      }
      
      window.speechSynthesis.speak(utterance)
    }
  }


  // Real-time countdown timer
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Start countdown if time remaining > 0 and game is in progress
    if (timeRemaining > 0 && (currentPhase === 'day' || currentPhase === 'night' || currentPhase === 'voting')) {
      const startTime = Date.now()
      const initialTime = timeRemaining
      
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime
        const newTime = initialTime - elapsed
        
        if (newTime <= 0) {
          // Clear timer when time runs out
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setTimeRemaining(0)
        } else {
          setTimeRemaining(Math.max(0, newTime))
        }
      }, 1000)
    }

    // Cleanup timer on unmount or when timeRemaining changes from server
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [timeRemaining, currentPhase])

  // Network state monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
      console.log('🌐 Network: Back online')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      console.log('📱 Network: Gone offline')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check initial state
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('🎭 SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('🎭 SW registration failed: ', registrationError)
          })
      })
    }
  }, [])

  useEffect(() => {
    // TTS 음성 초기화
    if ('speechSynthesis' in window) {
      // 음성 목록 로드
      window.speechSynthesis.getVoices()
      
      // 음성 목록이 변경될 때마다 재로드
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log('사용 가능한 한국어 음성:', voices.filter(v => v.lang.includes('ko')))
      }
    }
    
    if (!socket) return

    (socket as any).on('room:created', (data: any) => {
      setRoomCode(data.roomCode)
      roomCodeRef.current = data.roomCode
      setGameState('waiting')
    })

    (socket as any).on('room:joined', (data: any) => {
      setPlayers(data.players)
      
      // Check if this is a reconnection (has gameState info)
      if (data.gameState) {
        setRoomCode(data.roomCode)
        roomCodeRef.current = data.roomCode
        
        // Restore game state if game is in progress
        if (data.gameState.isStarted) {
          setGameState('game')
          setCurrentPhase(data.gameState.phase)
          setCurrentDay(data.gameState.day)
          setTimeRemaining(data.gameState.timeRemaining)
          
          // Restore player's role if available
          if (data.myPlayer && data.myPlayer.role) {
            setMyRole(data.myPlayer.role)
            setMyPlayer(data.myPlayer)
          }
        } else {
          setGameState('waiting')
        }
        
        console.log('Successfully reconnected to game')
      } else {
        // Normal room join
        setGameState('waiting')
        if (data.roomCode) {
          setRoomCode(data.roomCode)
          roomCodeRef.current = data.roomCode
        }
      }
    })

    (socket as any).on('error', (data: any) => {
      if (data.message?.includes('reconnected') || data.message?.includes('disconnected')) {
        setGameLog((prev: string[]) => [...prev, data.message])
      }
    })

    (socket as any).on('room:playerUpdate', (data: any) => {
      setPlayers(data.players)
      if (data.message) {
        setGameLog((prev: string[]) => [...prev, data.message])
      }
    })

    (socket as any).on('game:started', (data: any) => {
      setGameState('game')
      setCurrentPhase(data.phase)
      setCurrentDay(data.day)
      setPhaseMessage(data.message)
    })

    (socket as any).on('role:assigned', (data: any) => {
      setMyRole(data.role)
      setRoleInfo(data.roleInfo)
      // Update myPlayer in context
      if (players.length > 0) {
        const currentPlayer = players.find(p => p.name === playerName)
        if (currentPlayer) {
          setMyPlayer({
            ...currentPlayer,
            role: data.role,
            roleInfo: data.roleInfo
          })
        }
      }
    })

    (socket as any).on('phase:night', (data: any) => {
      setCurrentPhase('night')
      setCurrentDay(data.day)
      setTimeRemaining(data.timeRemaining)
      setPhaseMessage(data.message)
      setCanVote(false)
      setCanAct(false)
      // TTS 알림 - 밤 분위기에 맞게 조용하고 긴장감 있게
      speak(`${data.day}일차 밤이 되었습니다. 마피아는 제거할 대상을 선택하세요.`, 0.85, 0.95)
    })

    (socket as any).on('phase:day', (data: any) => {
      setCurrentPhase('day')
      setCurrentDay(data.day)
      setTimeRemaining(data.timeRemaining)
      setPhaseMessage(data.message)
      // 살아있는 플레이어 정보로 기존 players 업데이트
      if (data.alivePlayers) {
        setPlayers((prev: Player[]) => prev.map((p: Player) => {
          const alivePlayer = data.alivePlayers.find((ap: any) => ap.id === p.id)
          if (alivePlayer) {
            return { ...p, isAlive: alivePlayer.isAlive }
          }
          return p
        }))
      }
      // 낮 페이즈에서 투표 가능
      setCanVote(data.canVote || false)
      setCanAct(false)
      // TTS 알림 - 낮 분위기에 맞게 밝고 활기차게
      speak(`${data.day}일차 아침이 밝았습니다. 토론하고 투표하세요.`, 0.95, 1.05)
    })

    (socket as any).on('phase:voting', (data: any) => {
      setCurrentPhase('voting')
      setTimeRemaining(data.timeRemaining)
      setPhaseMessage(data.message)
      // 살아있는 플레이어 정보로 기존 players 업데이트
      if (data.alivePlayers) {
        setPlayers((prev: Player[]) => prev.map((p: Player) => {
          const alivePlayer = data.alivePlayers.find((ap: any) => ap.id === p.id)
          if (alivePlayer) {
            return { ...p, isAlive: alivePlayer.isAlive }
          }
          return p
        }))
      }
      setCanVote(true)
      setCanAct(false)
      // TTS 알림 - 긴장감 있게
      speak('투표 시간입니다. 의심스러운 사람을 선택하세요.', 0.9, 1.0)
    })

    (socket as any).on('night:actionAvailable', (data: any) => {
      setCanAct(data.canAct)
      setActionType(data.actionType)
      // 더미 액션인 경우 자동으로 전송
      if (data.isDummy) {
        const delay = Math.random() * 3000 + 2000 // 2-5초 랜덤 딜레이
        console.log(`Dummy action will be sent in ${Math.floor(delay/1000)} seconds`)
        setTimeout(() => {
          console.log(`Sending dummy action for room: ${roomCodeRef.current}`)
          socket.emit('night:action', {
            roomCode: roomCodeRef.current,
            actionType: 'dummy',
            targetPlayerId: ''
          })
        }, delay)
      }
    })
    
    (socket as any).on('mafia:voteStatus', (data: any) => {
      // 마피아 투표 현황 업데이트
      setGameLog((prev: string[]) => [...prev, data.message])
    })

    (socket as any).on('night:result', (data: any) => {
      setGameLog((prev: string[]) => [...prev, data.message])
      // 살아있는 플레이어 정보로 기존 players 업데이트
      if (data.alivePlayers) {
        setPlayers((prev: Player[]) => prev.map((p: Player) => {
          const alivePlayer = data.alivePlayers.find((ap: any) => ap.id === p.id)
          if (alivePlayer) {
            return { ...p, isAlive: alivePlayer.isAlive }
          }
          return { ...p, isAlive: false } // 목록에 없으면 사망
        }))
      }
      // TTS 알림 - 결과 발표는 천천히
      speak(data.message, 0.85, 1.0)
    })

    (socket as any).on('voting:result', (data: any) => {
      setGameLog((prev: string[]) => [...prev, data.message])
      // 살아있는 플레이어 정보로 기존 players 업데이트
      if (data.alivePlayers) {
        setPlayers((prev: Player[]) => prev.map((p: Player) => {
          const alivePlayer = data.alivePlayers.find((ap: any) => ap.id === p.id)
          if (alivePlayer) {
            return { ...p, isAlive: alivePlayer.isAlive }
          }
          return { ...p, isAlive: false } // 목록에 없으면 사망
        }))
      }
      // TTS 알림 - 투표 결과는 긴장감 있게
      speak(data.message, 0.85, 1.0)
    })

    (socket as any).on('vote:confirmed', (data: any) => {
      setGameLog((prev: string[]) => [...prev, data.message])
      setCanVote(false)
    })

    (socket as any).on('voting:progress', (data: any) => {
      setGameLog((prev: string[]) => [...prev, data.message])
      // 진행률이 100%에 가까우면 빠른 진행 알림
      if (data.voted === data.total - 1) {
        setGameLog((prev: string[]) => [...prev, '한 명만 더 투표하면 즉시 진행됩니다!'])
      }
    })

    (socket as any).on('night:actionConfirmed', (data: any) => {
      setGameLog((prev: string[]) => [...prev, data.message])
      setCanAct(false)
    })

    (socket as any).on('investigate:result', (data: any) => {
      const targetPlayer = players.find(p => p.id === data.target)
      const message = `조사 결과: ${targetPlayer?.name}은(는) ${data.result === 'mafia' ? '마피아' : '무고한 시민'}입니다.`
      setGameLog((prev: string[]) => [...prev, message])
    })

    (socket as any).on('game:ended', (data: any) => {
      setGameState('ended')
      setWinner(data.winner)
      setPhaseMessage(data.message)
      setPlayers(data.finalPlayers)
      setGameLog(data.gameLog)
      // TTS 알림 - 게임 종료는 장엄하게
      speak(data.message, 0.8, 0.95)
    })

    (socket as any).on('error', (data: any) => {
      alert(data.message)
    })

    return () => {
      ;(socket as any).off('room:created')
      ;(socket as any).off('room:joined')
      ;(socket as any).off('room:playerUpdate')
      ;(socket as any).off('game:started')
      ;(socket as any).off('role:assigned')
      ;(socket as any).off('phase:night')
      ;(socket as any).off('phase:day')
      ;(socket as any).off('phase:voting')
      ;(socket as any).off('night:actionAvailable')
      ;(socket as any).off('mafia:voteStatus')
      ;(socket as any).off('night:result')
      ;(socket as any).off('voting:result')
      ;(socket as any).off('vote:confirmed')
      ;(socket as any).off('voting:progress')
      ;(socket as any).off('night:actionConfirmed')
      ;(socket as any).off('investigate:result')
      ;(socket as any).off('game:ended')
      ;(socket as any).off('error')
    }
  }, [socket, playerName, players])

  const createRoom = () => {
    if (socket && playerName) {
      socket.emit('room:create', { playerName, maxPlayers: 20 })
    }
  }

  const joinRoom = () => {
    if (socket && playerName && roomCode) {
      socket.emit('room:join', { playerName, roomCode })
    }
  }

  const startGame = () => {
    if (socket && players.length >= 6) {
      socket.emit('game:start', { roomCode })
    }
  }

  const castVote = () => {
    if (socket && selectedTarget && canVote) {
      socket.emit('vote:cast', { roomCode, targetPlayerId: selectedTarget })
      setSelectedTarget('')
    }
  }

  const performNightAction = () => {
    if (socket && selectedTarget && canAct && actionType) {
      socket.emit('night:action', { roomCode, actionType, targetPlayerId: selectedTarget })
      setSelectedTarget('')
    }
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Main App Rendering
  if (gameState === 'home') {
    if (isMobile) {
      return (
        <MobileOptimizedHome
          playerName={playerName}
          setPlayerName={setPlayerName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          isConnected={isConnected}
          createRoom={createRoom}
          joinRoom={joinRoom}
        />
      )
    }

    // Desktop layout
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
          {/* TTS 설정 버튼 */}
          <button
            onClick={() => setShowTTSSettings(true)}
            className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-800"
            title="음성 설정"
          >
            🔊
          </button>
          
          <h1 className="text-3xl font-bold text-center mb-6">🎭 한국형 마피아 게임</h1>
          
          <div className="mb-4">
            <p className="text-center text-sm text-gray-600 mb-2">
              서버 연결: {isConnected ? '✅ 연결됨' : '❌ 연결 안됨'}
            </p>
          </div>

          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
          />

          <div className="space-y-3">
            <button
              onClick={createRoom}
              disabled={!playerName || !isConnected}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              방 만들기 (6-20명)
            </button>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="참여 코드"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="flex-1 p-3 border rounded-lg"
              />
              <button
                onClick={joinRoom}
                disabled={!playerName || !roomCode || !isConnected}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                참여하기
              </button>
            </div>
            
          </div>
        </div>
        
        {/* TTS 설정 모달 */}
        {showTTSSettings && (
          <TTSSettings onClose={() => setShowTTSSettings(false)} />
        )}
        
        {/* PWA Installer */}
        <PWAInstaller />
        <OfflineNotification />
      </div>
    )
  }

  if (gameState === 'waiting') {
    if (isMobile) {
      return (
        <MobileOptimizedWaiting
          roomCode={roomCode}
          players={players}
          playerName={playerName}
          startGame={startGame}
        />
      )
    }

    // Desktop layout
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-4">대기실</h2>
          <p className="text-center text-lg mb-4">참여 코드: <span className="font-mono font-bold text-2xl">{roomCode}</span></p>
          
          <div className="mb-6">
            <h3 className="font-bold mb-2">참가자 ({players.length}/20):</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((player, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded text-center">
                  {player.name} {player.isHost && '👑'}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            {players.length < 6 ? (
              <p className="text-red-600">최소 6명이 필요합니다. ({6 - players.length}명 더 필요)</p>
            ) : (
              <button
                onClick={startGame}
                className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 text-lg font-bold"
              >
                게임 시작하기
              </button>
            )}
          </div>
        </div>
        <OfflineNotification />
      </div>
    )
  }

  // Game screen
  if (gameState === 'game') {
    const alivePlayers = players.filter(p => p.isAlive)
    const currentPlayer = players.find(p => p.name === playerName)
    const isAlive = currentPlayer?.isAlive !== false

    if (isMobile) {
      return (
        <MobileOptimizedGame
          roomCode={roomCode}
          currentDay={currentDay}
          currentPhase={currentPhase}
          phaseMessage={phaseMessage}
          timeRemaining={timeRemaining}
          players={players}
          myRole={myRole}
          roleInfo={roleInfo}
          playerName={playerName}
          gameLog={gameLog}
          canVote={canVote}
          canAct={canAct}
          actionType={actionType}
          selectedTarget={selectedTarget}
          setSelectedTarget={setSelectedTarget}
          castVote={castVote}
          performNightAction={performNightAction}
          formatTime={formatTime}
        />
      )
    }

    // Desktop layout
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">🎭 마피아 게임</h1>
              <div className="text-right">
                <div className="text-sm text-gray-300">방 코드: {roomCode}</div>
                <div className="text-sm text-gray-300">{currentDay}일차</div>
              </div>
            </div>
          </div>

          {/* Phase Info */}
          <div className="bg-blue-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">
                  {currentPhase === 'night' ? '🌙 밤' : 
                   currentPhase === 'day' ? '☀️ 낮' : 
                   currentPhase === 'voting' ? '🗳️ 투표' : '게임'}
                </h2>
                <p className="text-blue-200">{phaseMessage}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono">{formatTime(timeRemaining)}</div>
                <div className="text-sm text-blue-200">남은 시간</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - My Role */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold mb-2">내 역할</h3>
                {myRole && (
                  <div className="space-y-2">
                    <RoleCard 
                      role={myRole} 
                      playerName={playerName}
                      isRevealed={true}
                      size="medium"
                    />
                    <div className="text-sm text-gray-300">
                      {roleInfo?.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Panel */}
              {isAlive && (canVote || (canAct && actionType !== 'dummy')) && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2">
                    {canVote ? '투표하기' : '밤 행동'}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    {alivePlayers.map(player => (
                      <label key={player.id} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="target"
                          value={player.id}
                          checked={selectedTarget === player.id}
                          onChange={(e) => setSelectedTarget(e.target.value)}
                          disabled={player.name === playerName}
                          className="text-blue-600"
                        />
                        <span className={player.name === playerName ? 'text-gray-500' : ''}>
                          {player.name} {player.name === playerName && '(나)'}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={canVote ? castVote : performNightAction}
                    disabled={!selectedTarget || selectedTarget === currentPlayer?.id}
                    className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-600"
                  >
                    {canVote ? '투표하기' : 
                     actionType === 'kill' ? '공격하기' :
                     actionType === 'heal' ? '치료하기' :
                     actionType === 'investigate' ? '조사하기' : '행동하기'}
                  </button>
                </div>
              )}
              
              {/* Dummy Action Info for Citizens */}
              {isAlive && canAct && actionType === 'dummy' && (
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <h3 className="font-bold mb-2">밤 대기 중</h3>
                  <p className="text-gray-300">다른 플레이어들이 행동 중입니다...</p>
                  <div className="mt-2">
                    <div className="animate-pulse bg-gray-700 h-2 rounded"></div>
                  </div>
                </div>
              )}

              {!isAlive && (
                <div className="bg-red-900 rounded-lg p-4 text-center">
                  <h3 className="font-bold text-red-300">💀 사망</h3>
                  <p className="text-red-200">게임을 지켜보세요</p>
                </div>
              )}
            </div>

            {/* Center Column - Players */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-4">플레이어 ({alivePlayers.length}명)</h3>
              <div className="grid grid-cols-2 gap-2">
                {players.map(player => (
                  <div 
                    key={player.id} 
                    className={`p-2 rounded text-center ${
                      player.isAlive ? 'bg-gray-700' : 'bg-red-900 opacity-50'
                    }`}
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-gray-400">
                      {player.isHost && '👑 '}
                      {!player.isAlive && '💀 '}
                      {player.name === playerName && '(나)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Game Log */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-4">게임 로그</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {gameLog.map((log, index) => (
                  <div key={index} className="text-sm text-gray-300 p-1 bg-gray-700 rounded">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Dead Chat System */}
        <DeadChat />
        <OfflineNotification />
      </div>
    )
  }

  // Game ended screen
  if (gameState === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full text-center">
          <h1 className="text-4xl font-bold mb-4">🎭 게임 종료</h1>
          <div className="text-2xl mb-6">
            {winner === 'mafia' ? '🔴 마피아팀 승리!' : '🔵 시민팀 승리!'}
          </div>
          <p className="text-lg mb-6">{phaseMessage}</p>
          
          <div className="mb-6">
            <h3 className="font-bold mb-4">최종 결과</h3>
            <div className="grid grid-cols-2 gap-2">
              {players.map(player => (
                <div key={player.id} className="bg-gray-700 p-2 rounded">
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-gray-400">
                    역할: {player.role} {!player.isAlive && '💀'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            새 게임 시작
          </button>
        </div>
        <OfflineNotification />
      </div>
    )
  }

  return (
    <div>
      Unknown game state
      <PWAInstaller />
      <OfflineNotification />
    </div>
  )
}

export default App