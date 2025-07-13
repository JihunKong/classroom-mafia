// client/src/components/TeacherDashboard.tsx

import { useState, useEffect } from 'react'
import { TeacherClassroom } from './TeacherClassroom'
import { TeacherAnalytics } from './TeacherAnalytics'
import { TeacherSettings } from './TeacherSettings'

interface TeacherDashboardProps {
  teacherData: {
    teacherId: string
    teacherName: string
    capabilities: any
  }
  socket: any
  onLogout: () => void
}

type DashboardTab = 'classroom' | 'analytics' | 'settings'

interface ClassroomSession {
  id: string
  teacherName: string
  className: string
  createdAt: Date
  isActive: boolean
  rooms: any[]
  settings: any
  analytics: any
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ 
  teacherData, 
  socket, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('classroom')
  const [currentSession, setCurrentSession] = useState<ClassroomSession | null>(null)
  const [rooms, setRooms] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    if (!socket) return

    // Teacher socket connection events
    socket.on('connect', () => {
      setIsConnected(true)
      console.log('Teacher socket connected')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Teacher socket disconnected')
    })

    socket.on('classroom:created', (data: any) => {
      setCurrentSession(data.session)
      addNotification(`클래스룸 '${data.session.className}'이 생성되었습니다.`)
    })

    socket.on('classroom:joined', (data: any) => {
      setCurrentSession(data.session)
      setRooms(data.currentRooms)
      addNotification(`클래스룸 '${data.session.className}'에 참여했습니다.`)
    })

    socket.on('room:created', (data: any) => {
      addNotification(`새 게임룸 '${data.roomName}' (${data.roomCode})이 생성되었습니다.`)
      // Refresh room list
      refreshRooms()
    })

    socket.on('classroom:roomAdded', (data: any) => {
      setRooms(prev => [...prev, data.room])
    })

    socket.on('room:controlSuccess', (data: any) => {
      addNotification(`제어 명령 '${data.action}'이 실행되었습니다.`)
    })

    socket.on('moderation:success', (data: any) => {
      addNotification(`${data.studentName}에게 '${data.action}' 조치를 실행했습니다.`)
    })

    socket.on('settings:updated', (data: any) => {
      addNotification('클래스룸 설정이 업데이트되었습니다.')
      if (currentSession) {
        setCurrentSession(prev => prev ? { ...prev, settings: data.settings } : null)
      }
    })

    socket.on('analytics:overview', (/* data: any */) => {
      // Handle analytics data
    })

    socket.on('error', (data: any) => {
      addNotification(`오류: ${data.message}`)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('classroom:created')
      socket.off('classroom:joined')
      socket.off('room:created')
      socket.off('classroom:roomAdded')
      socket.off('room:controlSuccess')
      socket.off('moderation:success')
      socket.off('settings:updated')
      socket.off('analytics:overview')
      socket.off('error')
    }
  }, [socket, currentSession])

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]) // Keep only 5 most recent
  }

  const refreshRooms = () => {
    if (currentSession && socket) {
      // Request updated room status
      socket.emit('analytics:request', { 
        type: 'room_specific',
        roomCode: null
      })
    }
  }

  const tabs = [
    { id: 'classroom' as DashboardTab, name: '클래스룸 관리', icon: '🏫' },
    { id: 'analytics' as DashboardTab, name: '분석', icon: '📊' },
    { id: 'settings' as DashboardTab, name: '설정', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">👨‍🏫 교사 대시보드</h1>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? '연결됨' : '연결 끊김'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {notifications.length > 0 && (
                <div className="relative">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
                    <div className="text-sm text-blue-800">
                      {notifications[0]}
                    </div>
                    {notifications.length > 1 && (
                      <div className="text-xs text-blue-600 mt-1">
                        +{notifications.length - 1}개 더
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Teacher Info */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{teacherData.teacherName}</div>
                <div className="text-xs text-gray-500">교사</div>
              </div>

              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'classroom' && (
          <TeacherClassroom
            socket={socket}
            currentSession={currentSession}
            setCurrentSession={setCurrentSession}
            rooms={rooms}
            setRooms={setRooms}
            teacherData={teacherData}
          />
        )}

        {activeTab === 'analytics' && (
          <TeacherAnalytics
            socket={socket}
            currentSession={currentSession}
            rooms={rooms}
          />
        )}

        {activeTab === 'settings' && (
          <TeacherSettings
            socket={socket}
            currentSession={currentSession}
            setCurrentSession={setCurrentSession}
          />
        )}
      </main>
    </div>
  )
}