// client/src/components/PWAInstaller.tsx

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const PWAInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebAppiOS)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show install banner after a delay
      setTimeout(() => {
        setShowInstallBanner(true)
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('🎭 PWA: App was installed')
      setIsInstalled(true)
      setShowInstallBanner(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true)
      }
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log('🎭 PWA: User choice:', outcome)
      
      if (outcome === 'accepted') {
        setShowInstallBanner(false)
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('🎭 PWA: Install error:', error)
    }
  }

  const dismissBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or recently dismissed
  if (isInstalled) return null
  
  const lastDismissed = localStorage.getItem('pwa-install-dismissed')
  if (lastDismissed && Date.now() - parseInt(lastDismissed) < 7 * 24 * 60 * 60 * 1000) {
    return null // Hide for 7 days after dismissal
  }

  return (
    <>
      {/* Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mobile-slide-in">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">앱으로 설치하기</h4>
                <p className="text-sm text-gray-600 mb-3">
                  홈 화면에 추가하여 빠르게 접속하세요!
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleInstallClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    설치하기
                  </button>
                  <button
                    onClick={dismissBanner}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    나중에
                  </button>
                </div>
              </div>
              <button
                onClick={dismissBanner}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowIOSInstructions(false)}></div>
          <div className="relative bg-white rounded-xl p-6 max-w-sm w-full mobile-fade-in">
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">iOS에서 앱 설치하기</h3>
              
              <div className="space-y-4 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                  <div>
                    <p className="text-sm text-gray-700">Safari 하단의 <strong>공유</strong> 버튼을 누르세요</p>
                    <p className="text-xs text-gray-500">📤 아이콘</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                  <div>
                    <p className="text-sm text-gray-700"><strong>"홈 화면에 추가"</strong>를 선택하세요</p>
                    <p className="text-xs text-gray-500">➕ 아이콘</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                  <div>
                    <p className="text-sm text-gray-700"><strong>"추가"</strong> 버튼을 누르세요</p>
                    <p className="text-xs text-gray-500">완료!</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="mt-6 w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Button (always available) */}
      {(deferredPrompt || isIOS) && !showInstallBanner && (
        <div className="fixed top-4 right-4 z-40">
          <button
            onClick={handleInstallClick}
            className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all transform hover:scale-105"
            title="앱으로 설치하기"
          >
            <span className="text-lg">📱</span>
          </button>
        </div>
      )}
    </>
  )
}

// Hook for PWA installation status
export const usePWAInstall = () => {
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebAppiOS)

    // Check if can install
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return { isInstalled, canInstall }
}