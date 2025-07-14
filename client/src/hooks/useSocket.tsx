// client/src/hooks/useSocket.ts

import { useContext, createContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, SocketEvents } from '../../../shared/types';

// For production, use relative URL to connect to the same origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

interface SocketContextType {
  socket: Socket<ServerToClientEvents, SocketEvents> | null;
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
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, SocketEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 Creating socket connection to:', SOCKET_URL);
    console.log('🌍 Environment:', import.meta.env.MODE);
    console.log('🏭 Production mode:', import.meta.env.PROD);
    console.log('📡 All env vars:', import.meta.env);
    
    let newSocket: any;
    
    try {
      newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 60000,
      });

      console.log('✅ Socket object created:', newSocket);
      console.log('🔧 Socket.on function exists:', typeof newSocket.on);

      // Validate socket was created properly
      if (!newSocket || typeof newSocket.on !== 'function') {
        console.error('❌ Socket creation failed - invalid socket object');
        throw new Error('Socket creation failed');
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
      if (newSocket) {
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