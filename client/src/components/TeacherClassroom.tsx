// client/src/components/TeacherClassroom.tsx

import { useState } from 'react'
import { Socket } from 'socket.io-client'

interface TeacherClassroomProps {
  socket: Socket
  currentSession: any
  setCurrentSession: (session: any) => void
  rooms: any[]
  setRooms: (rooms: any[]) => void
  teacherData: any
}

interface CreateClassroomForm {
  className: string
  settings: {
    allowCustomRoles: boolean
    enableDeadChat: boolean
    enableVoiceChat: boolean
    gameTimeLimit: number
    maxGamesPerStudent: number
    profanityFilter: boolean
    pauseOnDisconnect: boolean
    showRoleReveal: boolean
    enableSpectatorMode: boolean
  }
}

interface CreateRoomForm {
  roomName: string
  maxPlayers: number
  customRoles: string[]
}

export const TeacherClassroom: React.FC<TeacherClassroomProps> = ({
  socket,
  currentSession,
  // setCurrentSession,
  rooms,
  // setRooms,
  // teacherData
}) => {
  const [showCreateClassroom, setShowCreateClassroom] = useState(false)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showRoomDetails, setShowRoomDetails] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<CreateClassroomForm>({
    className: '',
    settings: {
      allowCustomRoles: false,
      enableDeadChat: true,
      enableVoiceChat: false,
      gameTimeLimit: 45,
      maxGamesPerStudent: 3,
      profanityFilter: true,
      pauseOnDisconnect: true,
      showRoleReveal: true,
      enableSpectatorMode: true
    }
  })
  const [roomForm, setRoomForm] = useState<CreateRoomForm>({
    roomName: '',
    maxPlayers: 10,
    customRoles: []
  })

  const handleCreateClassroom = () => {
    if (!createForm.className.trim()) {
      alert('클래스명을 입력해주세요.')
      return
    }

    if (socket) {
      socket.emit('classroom:create', {
        className: createForm.className.trim(),
        settings: createForm.settings
      })
      setShowCreateClassroom(false)
      setCreateForm(prev => ({ ...prev, className: '' }))
    }
  }

  const handleCreateRoom = () => {
    if (!currentSession) {
      alert('먼저 클래스룸을 생성해주세요.')
      return
    }

    if (!roomForm.roomName.trim()) {
      alert('게임룸 이름을 입력해주세요.')
      return
    }

    if (socket) {
      socket.emit('room:create', {
        roomName: roomForm.roomName.trim(),
        maxPlayers: roomForm.maxPlayers,
        customRoles: roomForm.customRoles
      })
      setShowCreateRoom(false)
      setRoomForm(prev => ({ ...prev, roomName: '' }))
    }
  }

  const handleRoomControl = (roomCode: string, action: string, parameters?: any) => {
    if (socket) {
      socket.emit('room:control', {
        roomCode,
        action,
        parameters: parameters || {}
      })
    }
  }

  // const handleStudentModeration = (roomCode: string, studentId: string, action: string, reason: string) => {
  //   if (socket) {
  //     socket.emit('student:moderate', {
  //       roomCode,
  //       studentId,
  //       action,
  //       reason
  //     })
  //   }
  // }

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'waiting': return '⏳'
      case 'night': return '🌙'
      case 'day': return '☀️'
      case 'voting': return '🗳️'
      case 'ended': return '🏁'
      default: return '❓'
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      case 'night': return 'bg-indigo-100 text-indigo-800'
      case 'day': return 'bg-blue-100 text-blue-800'
      case 'voting': return 'bg-orange-100 text-orange-800'
      case 'ended': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Session Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">클래스룸 상태</h2>
          <div className="flex space-x-2">
            {!currentSession && (
              <button
                onClick={() => setShowCreateClassroom(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                클래스룸 생성
              </button>
            )}
            {currentSession && (
              <button
                onClick={() => setShowCreateRoom(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                게임룸 추가
              </button>
            )}
          </div>
        </div>

        {currentSession ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">{currentSession.className}</h3>
                <p className="text-sm text-green-700">
                  생성일: {new Date(currentSession.createdAt).toLocaleString('ko-KR')}
                </p>
                <p className="text-sm text-green-700">
                  활성 게임룸: {rooms.length}개
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-600">✅ 활성</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-gray-600">클래스룸을 생성하여 시작하세요.</p>
          </div>
        )}
      </div>

      {/* Game Rooms */}
      {currentSession && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">게임룸 관리</h2>
          
          {rooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">생성된 게임룸이 없습니다.</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                첫 번째 게임룸 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div key={room.code} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{room.name}</h3>
                      <p className="text-sm text-gray-600">코드: {room.code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPhaseColor(room.phase)}`}>
                      {getPhaseIcon(room.phase)} {room.phase}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">플레이어:</span>
                      <span className="font-medium">{room.playerCount}/{room.maxPlayers}</span>
                    </div>
                    {room.isStarted && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">생존자:</span>
                          <span className="font-medium">{room.alivePlayers}명</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">일차:</span>
                          <span className="font-medium">{room.day}일차</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Room Controls */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {!room.isStarted ? (
                        <button
                          onClick={() => handleRoomControl(room.code, 'start')}
                          disabled={room.playerCount < 6}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                        >
                          시작
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRoomControl(room.code, 'pause')}
                          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                        >
                          일시정지
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRoomControl(room.code, 'end_game', { reason: '교사에 의한 종료' })}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        종료
                      </button>
                    </div>

                    <button
                      onClick={() => setShowRoomDetails(showRoomDetails === room.code ? null : room.code)}
                      className="w-full bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                    >
                      {showRoomDetails === room.code ? '상세 닫기' : '상세 보기'}
                    </button>
                  </div>

                  {/* Room Details */}
                  {showRoomDetails === room.code && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-900 mb-2">고급 제어</h4>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() => handleRoomControl(room.code, 'force_phase', { targetPhase: 'day' })}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                            >
                              낮으로
                            </button>
                            <button
                              onClick={() => handleRoomControl(room.code, 'force_phase', { targetPhase: 'night' })}
                              className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600"
                            >
                              밤으로
                            </button>
                            <button
                              onClick={() => handleRoomControl(room.code, 'reveal_roles')}
                              className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                            >
                              역할공개
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('조치 사유를 입력하세요:')
                                if (reason) {
                                  // This would need to be implemented with player selection
                                  console.log('Player moderation not implemented in this view')
                                }
                              }}
                              className="bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600"
                            >
                              학생조치
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Classroom Modal */}
      {showCreateClassroom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">새 클래스룸 생성</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">클래스명</label>
                <input
                  type="text"
                  value={createForm.className}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, className: e.target.value }))}
                  placeholder="예: 3학년 1반 마피아 게임"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기본 설정</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createForm.settings.enableDeadChat}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, enableDeadChat: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">데드챗 활성화</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createForm.settings.profanityFilter}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, profanityFilter: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">욕설 필터</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createForm.settings.showRoleReveal}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, showRoleReveal: e.target.checked }
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">게임 종료 시 역할 공개</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateClassroom}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                생성하기
              </button>
              <button
                onClick={() => setShowCreateClassroom(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">새 게임룸 생성</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">게임룸 이름</label>
                <input
                  type="text"
                  value={roomForm.roomName}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, roomName: e.target.value }))}
                  placeholder="예: 1조 게임"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최대 플레이어 수</label>
                <select
                  value={roomForm.maxPlayers}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 15 }, (_, i) => i + 6).map(num => (
                    <option key={num} value={num}>{num}명</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateRoom}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
              >
                생성하기
              </button>
              <button
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}