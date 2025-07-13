import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { SocketProvider } from './hooks/useSocket'
import { GameProvider } from './hooks/useGame'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SocketProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </SocketProvider>
  </React.StrictMode>,
)