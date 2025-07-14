import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_SERVER_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'https://classroom-mafia-production.up.railway.app'
        : process.env.VITE_SERVER_URL || 'http://localhost:3001'
    ),
    'import.meta.env.VITE_SOCKET_URL': JSON.stringify(
      process.env.NODE_ENV === 'production' 
        ? 'https://classroom-mafia-production.up.railway.app'
        : process.env.VITE_SOCKET_URL || 'http://localhost:3001'
    )
  }
})