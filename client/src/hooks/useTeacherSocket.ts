// client/src/hooks/useTeacherSocket.ts

import { useEffect, useState, useRef } from 'react'

// Use global Socket.io from CDN
declare global {
  interface Window {
    io: any;
  }
}

// For production, use window.location.origin to connect to the same origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? 
    (typeof window !== 'undefined' ? window.location.origin : 'https://classroom-mafia-production.up.railway.app') : 
    'http://localhost:3001')

interface TeacherSocketState {
  socket: any | null
  isConnected: boolean
  isAuthenticated: boolean
  teacherData: {
    teacherId: string
    teacherName: string
    capabilities: any
  } | null
  error: string | null
}

export const useTeacherSocket = () => {
  const [state, setState] = useState<TeacherSocketState>({
    socket: null,
    isConnected: false,
    isAuthenticated: false,
    teacherData: null,
    error: null
  })

  const socketRef = useRef<any | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  const connectTeacherSocket = () => {
    console.log('Connecting to teacher namespace...')
    
    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    // Create new socket connection to teacher namespace using CDN Socket.io
    const socket = window.io(`${SOCKET_URL}/teacher`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    })

    socketRef.current = socket

    ;(socket as any).on('connect', () => {
      console.log('Teacher socket connected')
      setState(prev => ({ 
        ...prev, 
        socket, 
        isConnected: true, 
        error: null 
      }))
    })

    ;(socket as any).on('disconnect', (reason: string) => {
      console.log('Teacher socket disconnected:', reason)
      setState(prev => ({ 
        ...prev, 
        isConnected: false,
        isAuthenticated: false,
        teacherData: null,
        error: 'Connection lost'
      }))

      // Auto-reconnect after 3 seconds if not manually disconnected
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectTeacherSocket()
        }, 3000)
      }
    })

    ;(socket as any).on('teacher:authenticated', (data: any) => {
      console.log('Teacher authenticated:', data)
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: true,
        teacherData: {
          teacherId: data.teacherId,
          teacherName: data.teacherName,
          capabilities: data.capabilities
        },
        error: null
      }))
    })

    ;(socket as any).on('teacher:authFailed', (data: any) => {
      console.log('Teacher authentication failed:', data)
      setState(prev => ({ 
        ...prev, 
        isAuthenticated: false,
        teacherData: null,
        error: data.message || 'Authentication failed'
      }))
    })

    ;(socket as any).on('connect_error', (error: any) => {
      console.error('Teacher socket connection error:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Connection failed'
      }))
    })

    ;(socket as any).on('error', (data: any) => {
      console.error('Teacher socket error:', data)
      setState(prev => ({ 
        ...prev, 
        error: data.message || 'Unknown error'
      }))
    })
  }

  const authenticateTeacher = (teacherName: string, accessCode: string) => {
    if (state.socket && state.isConnected) {
      console.log('Attempting teacher authentication...')
      setState(prev => ({ ...prev, error: null }))
      state.socket.emit('teacher:authenticate', {
        teacherName,
        accessCode
      })
    } else {
      setState(prev => ({ 
        ...prev, 
        error: 'Not connected to server'
      }))
    }
  }

  const disconnectTeacher = () => {
    console.log('Disconnecting teacher socket...')
    
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setState({
      socket: null,
      isConnected: false,
      isAuthenticated: false,
      teacherData: null,
      error: null
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return {
    ...state,
    connectTeacherSocket,
    authenticateTeacher,
    disconnectTeacher
  }
}