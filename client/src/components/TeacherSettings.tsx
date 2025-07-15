// client/src/components/TeacherSettings.tsx

import { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'

interface TeacherSettingsProps {
  socket: Socket
  currentSession: any
  setCurrentSession: (session: any) => void
}

interface ClassroomSettings {
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

export const TeacherSettings: React.FC<TeacherSettingsProps> = ({
  socket,
  currentSession,
  // setCurrentSession
}) => {
  const [settings, setSettings] = useState<ClassroomSettings>({
    allowCustomRoles: false,
    enableDeadChat: true,
    enableVoiceChat: false,
    gameTimeLimit: 45,
    maxGamesPerStudent: 3,
    profanityFilter: true,
    pauseOnDisconnect: true,
    showRoleReveal: true,
    enableSpectatorMode: true
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (currentSession?.settings) {
      setSettings(currentSession.settings)
    }
  }, [currentSession])

  const handleSettingChange = (key: keyof ClassroomSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    if (!socket || !currentSession || !hasChanges) return

    setIsSaving(true)
    socket.emit('settings:update', { settings })

    // Listen for success response
    const handleSuccess = () => {
      setHasChanges(false)
      setIsSaving(false)
      ;socket.off('settings:updated', handleSuccess)
    }

    ;socket.on('settings:updated', handleSuccess)
  }

  const resetSettings = () => {
    if (currentSession?.settings) {
      setSettings(currentSession.settings)
      setHasChanges(false)
    }
  }

  if (!currentSession) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">클래스룸을 생성하면 설정을 변경할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">클래스룸 설정</h2>
          <div className="flex space-x-3">
            {hasChanges && (
              <button
                onClick={resetSettings}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                재설정
              </button>
            )}
            <button
              onClick={saveSettings}
              disabled={!hasChanges || isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Game Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">🎮 게임 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  게임 시간 제한 (분)
                </label>
                <select
                  value={settings.gameTimeLimit}
                  onChange={(e) => handleSettingChange('gameTimeLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={30}>30분</option>
                  <option value={45}>45분</option>
                  <option value={60}>60분</option>
                  <option value={90}>90분</option>
                  <option value={120}>120분</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  게임이 이 시간을 초과하면 자동으로 종료됩니다.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학생당 최대 게임 수
                </label>
                <select
                  value={settings.maxGamesPerStudent}
                  onChange={(e) => handleSettingChange('maxGamesPerStudent', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1게임</option>
                  <option value={2}>2게임</option>
                  <option value={3}>3게임</option>
                  <option value={5}>5게임</option>
                  <option value={10}>10게임</option>
                  <option value={-1}>무제한</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  학생이 참여할 수 있는 최대 게임 수를 제한합니다.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.allowCustomRoles}
                  onChange={(e) => handleSettingChange('allowCustomRoles', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">커스텀 역할 허용</span>
                  <p className="text-xs text-gray-500">교사가 직접 역할을 배정할 수 있습니다.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.showRoleReveal}
                  onChange={(e) => handleSettingChange('showRoleReveal', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">게임 종료 시 역할 공개</span>
                  <p className="text-xs text-gray-500">게임이 끝나면 모든 플레이어의 역할을 공개합니다.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.pauseOnDisconnect}
                  onChange={(e) => handleSettingChange('pauseOnDisconnect', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">연결 끊김 시 게임 일시정지</span>
                  <p className="text-xs text-gray-500">플레이어가 연결을 잃으면 게임을 일시정지합니다.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.enableSpectatorMode}
                  onChange={(e) => handleSettingChange('enableSpectatorMode', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">관전자 모드 활성화</span>
                  <p className="text-xs text-gray-500">죽은 플레이어나 늦게 온 학생이 관전할 수 있습니다.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Communication Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">💬 소통 설정</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.enableDeadChat}
                  onChange={(e) => handleSettingChange('enableDeadChat', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">데드챗 활성화</span>
                  <p className="text-xs text-gray-500">죽은 플레이어들끼리 대화할 수 있습니다.</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.enableVoiceChat}
                  onChange={(e) => handleSettingChange('enableVoiceChat', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">음성 채팅 활성화</span>
                  <p className="text-xs text-gray-500">플레이어들이 음성으로 대화할 수 있습니다. (실험적 기능)</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.profanityFilter}
                  onChange={(e) => handleSettingChange('profanityFilter', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">욕설 필터 활성화</span>
                  <p className="text-xs text-gray-500">부적절한 언어를 자동으로 차단합니다.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Safety & Moderation */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">🛡️ 안전 및 조절</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">교사 권한</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 게임 시작, 일시정지, 강제 종료</li>
                <li>• 플레이어 경고, 음소거, 추방</li>
                <li>• 강제 페이즈 전환</li>
                <li>• 역할 공개</li>
                <li>• 실시간 게임 상황 모니터링</li>
              </ul>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">자동 모니터링</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 부적절한 언어 사용 감지</li>
                <li>• 게임 규칙 위반 행동 추적</li>
                <li>• 과도한 행동 패턴 탐지</li>
                <li>• 학생 참여도 분석</li>
              </ul>
            </div>
          </div>

          {/* Export Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">📤 내보내기 및 백업</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const data = JSON.stringify({ currentSession, settings }, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `classroom-${currentSession.className}-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center"
              >
                클래스룸 설정 내보내기
              </button>

              <button
                onClick={() => {
                  if (socket) {
                    socket.emit('analytics:request', { type: 'overview' })
                    // This would trigger a download of analytics data
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-center"
              >
                분석 데이터 내보내기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📋 세션 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">클래스명:</span>
            <div className="font-medium">{currentSession.className}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">교사:</span>
            <div className="font-medium">{currentSession.teacherName}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">생성일:</span>
            <div className="font-medium">
              {new Date(currentSession.createdAt).toLocaleString('ko-KR')}
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">세션 ID:</span>
            <div className="font-mono text-sm bg-gray-100 p-1 rounded">{currentSession.id}</div>
          </div>
        </div>
      </div>
    </div>
  )
}