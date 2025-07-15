// client/src/hooks/useSocket.ts

import { useContext, createContext, useEffect, useState, ReactNode } from 'react';
import * as SocketIOClient from 'socket.io-client';
import type { Socket } from 'socket.io-client';

const io = SocketIOClient.io || (SocketIOClient as any).default?.io || (SocketIOClient as any).default;

// For production, use window.location.origin to connect to the same origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? 
    (typeof window !== 'undefined' ? window.location.origin : 'https://classroom-mafia-production.up.railway.app') : 
    'http://localhost:3001');

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 Creating socket connection to:', SOCKET_URL);
    console.log('🌍 Environment:', import.meta.env.MODE);
    console.log('🏭 Production mode:', import.meta.env.PROD);
    console.log('📡 All env vars:', import.meta.env);
    
    let newSocket: Socket;
    
    try {
      console.log('🔧 About to call io() with URL:', SOCKET_URL);
      console.log('🔧 SocketIOClient:', SocketIOClient);
      console.log('🔧 SocketIOClient.io:', SocketIOClient.io);
      console.log('🔧 io function:', io);
      console.log('🔧 typeof io:', typeof io);
      
      if (typeof io !== 'function') {
        throw new Error(`io is not a function. Got: ${typeof io}. SocketIOClient keys: ${Object.keys(SocketIOClient).join(', ')}`);
      }
      
      // Create socket instance
      newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 60000,
        forceNew: true, // Force new connection
        upgrade: true,
        autoConnect: true
      });

      console.log('✅ Socket object created:', newSocket);
      console.log('🔧 Socket constructor:', newSocket.constructor.name);
      console.log('🔧 Socket.on function exists:', typeof newSocket.on);
      console.log('🔧 Socket prototype:', Object.getPrototypeOf(newSocket));

      // Additional validation
      if (!newSocket) {
        throw new Error('Socket creation returned null/undefined');
      }
      
      if (typeof newSocket.on !== 'function') {
        console.error('❌ Socket.on is not a function, got:', typeof newSocket.on);
        console.error('❌ Socket object keys:', Object.keys(newSocket));
        throw new Error(`Socket.on is not a function, got: ${typeof newSocket.on}`);
      }

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('🎉 Connected to server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('🔌 Disconnected from server');
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('🚨 Connection error:', error);
      });

      console.log('📝 Setting socket in state...');
      setSocket(newSocket);
    } catch (error) {
      console.error('💥 Error creating socket:', error);
      throw error;
    }

    return () => {
      console.log('🧹 Cleanup: closing socket');
      if (newSocket && typeof newSocket.close === 'function') {
        newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}