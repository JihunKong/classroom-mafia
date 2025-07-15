// client/src/components/TeacherAnalytics.tsx

import { useState, useEffect } from 'react'
import { Socket } from 'socket.io-client'

interface TeacherAnalyticsProps {
  socket: Socket
  currentSession: any
  rooms: any[]
}

interface AnalyticsData {
  overview?: {
    totalGames: number
    totalStudents: number
    activeRooms: number
    averageGameDuration: number
    winRates: Record<string, number>
    sessionDuration: number
  }
  engagement?: {
    studentEngagement: any[]
    participationTrends: any
    mostActiveStudents: any[]
  }
  outcomes?: {
    gameOutcomes: any[]
    roleDistribution: Record<string, number>
    winRatesByPlayerCount: any
    averageDurationByOutcome: any
  }
  behavior?: {
    totalIncidents: number
    incidentsByType: Record<string, number>
    incidentsBySeverity: Record<string, number>
    studentsWithIncidents: number
    timeline: any[]
  }
}

export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  socket,
  currentSession,
  rooms
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({})
  const [activeAnalytics, setActiveAnalytics] = useState<'overview' | 'engagement' | 'outcomes' | 'behavior'>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('today')

  useEffect(() => {
    if (!socket || !currentSession) return

    // Listen for analytics data
    ;socket.on('analytics:overview', (data: any) => {
      setAnalyticsData(prev => ({ ...prev, overview: data }))
      setIsLoading(false)
    })

    ;socket.on('analytics:engagement', (data: any) => {
      setAnalyticsData(prev => ({ ...prev, engagement: data }))
      setIsLoading(false)
    })

    ;socket.on('analytics:outcomes', (data: any) => {
      setAnalyticsData(prev => ({ ...prev, outcomes: data }))
      setIsLoading(false)
    })

    ;socket.on('analytics:behavior', (data: any) => {
      setAnalyticsData(prev => ({ ...prev, behavior: data }))
      setIsLoading(false)
    })

    return () => {
      ;socket.off('analytics:overview')
      ;socket.off('analytics:engagement')
      ;socket.off('analytics:outcomes')
      ;socket.off('analytics:behavior')
    }
  }, [socket, currentSession])

  const requestAnalytics = (type: string) => {
    if (!socket || !currentSession) return

    setIsLoading(true)
    socket.emit('analytics:request', {
      type,
      timeRange
    })
  }

  useEffect(() => {
    if (currentSession) {
      requestAnalytics(activeAnalytics)
    }
  }, [activeAnalytics, currentSession, timeRange])

  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`
    }
    return `${minutes}분`
  }

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`
  }

  if (!currentSession) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">클래스룸을 생성하면 분석 데이터를 확인할 수 있습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">클래스룸 분석</h2>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">오늘</option>
              <option value="week">이번 주</option>
              <option value="month">이번 달</option>
              <option value="all">전체</option>
            </select>
            <button
              onClick={() => requestAnalytics(activeAnalytics)}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? '로딩...' : '새로고침'}
            </button>
          </div>
        </div>

        {/* Analytics Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', name: '개요', icon: '📊' },
            { id: 'engagement', name: '참여도', icon: '👥' },
            { id: 'outcomes', name: '게임 결과', icon: '🏆' },
            { id: 'behavior', name: '행동 분석', icon: '📝' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAnalytics(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeAnalytics === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">분석 데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            {/* Overview Analytics */}
            {activeAnalytics === 'overview' && analyticsData.overview && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">클래스룸 개요</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-600 text-sm font-medium">총 게임 수</div>
                    <div className="text-2xl font-bold text-blue-900">{analyticsData.overview.totalGames}</div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-sm font-medium">참여 학생 수</div>
                    <div className="text-2xl font-bold text-green-900">{analyticsData.overview.totalStudents}</div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-orange-600 text-sm font-medium">활성 게임룸</div>
                    <div className="text-2xl font-bold text-orange-900">{analyticsData.overview.activeRooms}</div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-purple-600 text-sm font-medium">평균 게임 시간</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatDuration(analyticsData.overview.averageGameDuration)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">팀별 승률</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">마피아팀</span>
                        <span className="font-medium text-red-600">
                          {formatPercentage(analyticsData.overview.winRates.mafia || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">시민팀</span>
                        <span className="font-medium text-blue-600">
                          {formatPercentage(analyticsData.overview.winRates.citizen || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">중립팀</span>
                        <span className="font-medium text-purple-600">
                          {formatPercentage(analyticsData.overview.winRates.neutral || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">세션 정보</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">세션 시간</span>
                        <span className="font-medium">
                          {formatDuration(analyticsData.overview.sessionDuration)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">현재 게임룸</span>
                        <span className="font-medium">{rooms.length}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Engagement Analytics */}
            {activeAnalytics === 'engagement' && analyticsData.engagement && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">학생 참여도 분석</h3>
                
                {analyticsData.engagement.mostActiveStudents.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">가장 활발한 학생들 (상위 5명)</h4>
                    <div className="space-y-2">
                      {analyticsData.engagement.mostActiveStudents.map((student: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{student.studentName}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              {student.gamesPlayed}게임 참여
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-blue-600">
                              {student.participationScore}점
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.skillLevel}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analyticsData.engagement.studentEngagement.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    아직 충분한 참여 데이터가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* Outcomes Analytics */}
            {activeAnalytics === 'outcomes' && analyticsData.outcomes && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">게임 결과 분석</h3>
                
                {analyticsData.outcomes.gameOutcomes.length > 0 ? (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">최근 게임 결과</h4>
                    <div className="space-y-2">
                      {analyticsData.outcomes.gameOutcomes.slice(0, 5).map((outcome: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">게임 #{outcome.roomCode}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                {outcome.playerCount}명 참여
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {outcome.winner === 'mafia' ? '🔴 마피아 승리' : 
                                 outcome.winner === 'citizen' ? '🔵 시민 승리' : '🟡 중립 승리'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatDuration(outcome.duration)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    완료된 게임이 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* Behavior Analytics */}
            {activeAnalytics === 'behavior' && analyticsData.behavior && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900">행동 분석</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-600 text-sm font-medium">총 사건 수</div>
                    <div className="text-2xl font-bold text-yellow-900">{analyticsData.behavior.totalIncidents}</div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-orange-600 text-sm font-medium">관련 학생 수</div>
                    <div className="text-2xl font-bold text-orange-900">{analyticsData.behavior.studentsWithIncidents}</div>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-600 text-sm font-medium">고위험 사건</div>
                    <div className="text-2xl font-bold text-red-900">
                      {analyticsData.behavior.incidentsBySeverity.high || 0}
                    </div>
                  </div>
                </div>

                {analyticsData.behavior.totalIncidents === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    🎉 행동 관련 사건이 없습니다! 훌륭한 클래스입니다.
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">사건 유형별 분포</h4>
                    <div className="space-y-2">
                      {Object.entries(analyticsData.behavior.incidentsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                          <span className="text-sm">{type}</span>
                          <span className="font-medium">{count}건</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}