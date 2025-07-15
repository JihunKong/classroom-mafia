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
  optimizeDeps: {
    include: ['socket.io-client']
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemaps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          socketio: ['socket.io-client']
        }
      }
    }
  },
  define: {
    // Don't override these in define - let them be read from actual env vars
  }
})