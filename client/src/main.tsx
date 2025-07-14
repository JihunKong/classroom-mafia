import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { SocketProvider } from './hooks/useSocket'
import { GameProvider } from './hooks/useGame'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Temporarily disable StrictMode to avoid double useEffect calls
  <ErrorBoundary>
    <SocketProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </SocketProvider>
  </ErrorBoundary>
)