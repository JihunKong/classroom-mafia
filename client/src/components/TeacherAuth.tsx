// client/src/components/TeacherAuth.tsx

import { useState } from 'react'

interface TeacherAuthProps {
  onAuthenticated: (teacherData: { teacherId: string; teacherName: string; capabilities: any }) => void
  onCancel: () => void
}

export const TeacherAuth: React.FC<TeacherAuthProps> = ({ onAuthenticated, onCancel }) => {
  const [teacherName, setTeacherName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState('')

  const handleAuthenticate = async () => {
    if (!teacherName.trim() || !accessCode.trim()) {
      setError('이름과 액세스 코드를 입력해주세요.')
      return
    }

    setIsAuthenticating(true)
    setError('')

    try {
      // This will be handled by the parent component through socket
      const authData = { teacherName: teacherName.trim(), accessCode: accessCode.trim() }
      // For now, just pass the data up - actual auth will be handled by socket in parent
      onAuthenticated({
        teacherId: '',
        capabilities: null,
        ...authData
      })
    } catch (err) {
      setError('인증에 실패했습니다.')
      setIsAuthenticating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👨‍🏫 교사 대시보드</h1>
          <p className="text-gray-600">클래스룸 관리 시스템에 로그인하세요</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              교사 이름
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAuthenticating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              액세스 코드
            </label>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="액세스 코드를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAuthenticating}
            />
            <p className="text-xs text-gray-500 mt-1">
              유효한 코드: TEACHER2024, EDUCATOR, CLASSROOM
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {isAuthenticating ? '인증 중...' : '로그인'}
            </button>

            <button
              onClick={onCancel}
              disabled={isAuthenticating}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              취소
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-2">기능 미리보기</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• 실시간 게임 모니터링</p>
              <p>• 학생 행동 관리</p>
              <p>• 게임 제어 및 조정</p>
              <p>• 분석 및 리포트</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}