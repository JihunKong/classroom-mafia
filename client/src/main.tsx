import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { SocketProvider } from './hooks/useSocket'
import { GameProvider } from './hooks/useGame'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <SocketProvider>
        <GameProvider>
          <App />
        </GameProvider>
      </SocketProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)