// client/src/hooks/useSocket.ts

import { useContext, createContext, useEffect, useState, ReactNode } from 'react';
// Try different import approaches
import * as SocketIO from 'socket.io-client';

// For production, use window.location.origin to connect to the same origin
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD ? 
    (typeof window !== 'undefined' ? window.location.origin : 'https://classroom-mafia-production.up.railway.app') : 
    'http://localhost:3001');

interface SocketContextType {
  socket: any | null;
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
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('🔌 Creating socket connection to:', SOCKET_URL);
    console.log('🌍 Environment:', import.meta.env.MODE);
    console.log('🏭 Production mode:', import.meta.env.PROD);
    console.log('📡 All env vars:', import.meta.env);
    
    let newSocket: any;
    
    try {
      console.log('🔧 About to call io() with URL:', SOCKET_URL);
      console.log('🔧 SocketIO object:', SocketIO);
      console.log('🔧 SocketIO.io:', SocketIO.io);
      console.log('🔧 SocketIO default:', (SocketIO as any).default);
      
      // Try multiple ways to access the io function
      const ioFunction = SocketIO.io || (SocketIO as any).default || SocketIO;
      console.log('🔧 Using io function:', ioFunction);
      
      if (typeof ioFunction !== 'function') {
        throw new Error(`io function is not available. Got: ${typeof ioFunction}`);
      }
      
      newSocket = ioFunction(SOCKET_URL, {
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