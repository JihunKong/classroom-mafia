// client/public/sw.js
// Service Worker for Korean Mafia Game PWA

const CACHE_NAME = 'mafia-game-v1.0.0'
const OFFLINE_CACHE = 'mafia-offline-v1'

// Resources to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  // Role images
  '/assets/images/roles/citizen-team/citizen.png',
  '/assets/images/roles/citizen-team/doctor.png',
  '/assets/images/roles/citizen-team/police.png',
  '/assets/images/roles/citizen-team/detective.png',
  '/assets/images/roles/citizen-team/reporter.png',
  '/assets/images/roles/citizen-team/bartender.png',
  '/assets/images/roles/citizen-team/cheerleader.png',
  '/assets/images/roles/citizen-team/soldier.png',
  '/assets/images/roles/citizen-team/medium.png',
  '/assets/images/roles/citizen-team/thief.png',
  '/assets/images/roles/citizen-team/wizard.png',
  '/assets/images/roles/mafia-team/mafia.png',
  '/assets/images/roles/mafia-team/spy.png',
  '/assets/images/roles/mafia-team/werewolf.png',
  '/assets/images/roles/mafia-team/double_agent.png',
  '/assets/images/roles/neutral-team/turncoat.png',
  '/assets/images/roles/neutral-team/terrorist.png',
  '/assets/images/roles/neutral-team/illusionist.png',
  '/assets/images/roles/neutral-team/ghost.png',
  '/assets/images/roles/ui/day_phase.png',
  '/assets/images/roles/ui/night_phase.png',
  '/assets/images/roles/ui/vote_icon.png',
  '/assets/images/roles/ui/default_role.png'
]

// API endpoints that can work offline
const CACHEABLE_APIS = [
  '/health',
  '/admin/rooms'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🎭 Mafia Game SW: Installing...')
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('🎭 Mafia Game SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS.filter(url => url.startsWith('/')))
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('🎭 Mafia Game SW: Setting up offline cache')
        return cache.put('/offline.html', new Response(`
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>오프라인 - 마피아 게임</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
              }
              .container {
                max-width: 400px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px 20px;
                border: 1px solid rgba(255,255,255,0.2);
              }
              .icon { font-size: 64px; margin-bottom: 20px; }
              h1 { margin-bottom: 20px; }
              p { margin-bottom: 30px; opacity: 0.8; }
              .retry-btn {
                background: #4f46e5;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
              }
              .retry-btn:hover { background: #4338ca; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">📱</div>
              <h1>오프라인 상태</h1>
              <p>인터넷 연결을 확인해주세요.<br>연결되면 자동으로 게임을 재개합니다.</p>
              <button class="retry-btn" onclick="window.location.reload()">다시 시도</button>
            </div>
            <script>
              // Auto-retry when back online
              window.addEventListener('online', () => {
                window.location.reload();
              });
            </script>
          </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        }))
      })
    ])
  )
  
  // Force activation of new service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎭 Mafia Game SW: Activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('🎭 Mafia Game SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

// Fetch event - serve cached content with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/static/')) {
    // Static assets - cache first strategy
    event.respondWith(cacheFirst(request))
  } else if (CACHEABLE_APIs.some(api => url.pathname.startsWith(api))) {
    // API endpoints - network first with cache fallback
    event.respondWith(networkFirst(request))
  } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    // HTML pages - network first with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request))
  } else {
    // Other requests - network first
    event.respondWith(networkFirst(request))
  }
})

// Cache first strategy (for static assets)
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('🎭 Mafia Game SW: Cache first failed:', error)
    return new Response('Asset not available offline', { status: 404 })
  }
}

// Network first strategy (for API and dynamic content)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok && shouldCache(request)) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('🎭 Mafia Game SW: Network first fallback to cache:', request.url)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Network first with offline fallback (for pages)
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('🎭 Mafia Game SW: Serving offline page')
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Serve offline page
    const offlineCache = await caches.open(OFFLINE_CACHE)
    return offlineCache.match('/offline.html')
  }
}

// Helper function to determine if request should be cached
function shouldCache(request) {
  const url = new URL(request.url)
  
  // Don't cache WebSocket connections or real-time API calls
  if (url.pathname.includes('/socket.io/') || 
      url.pathname.includes('/realtime/') ||
      url.pathname.includes('/teacher/')) {
    return false
  }
  
  return true
}

// Background sync for failed actions (when network is restored)
self.addEventListener('sync', (event) => {
  console.log('🎭 Mafia Game SW: Background sync:', event.tag)
  
  if (event.tag === 'game-action-retry') {
    event.waitUntil(retryFailedGameActions())
  }
})

// Retry failed game actions when back online
async function retryFailedGameActions() {
  try {
    // Get stored failed actions from IndexedDB or localStorage
    const failedActions = await getStoredFailedActions()
    
    for (const action of failedActions) {
      try {
        await fetch(action.url, action.options)
        console.log('🎭 Mafia Game SW: Retried action successfully:', action.type)
        // Remove from storage
        await removeStoredAction(action.id)
      } catch (error) {
        console.log('🎭 Mafia Game SW: Failed to retry action:', action.type, error)
      }
    }
  } catch (error) {
    console.log('🎭 Mafia Game SW: Background sync error:', error)
  }
}

// Placeholder functions for action storage (would need IndexedDB implementation)
async function getStoredFailedActions() {
  // In a full implementation, this would read from IndexedDB
  return []
}

async function removeStoredAction(actionId) {
  // In a full implementation, this would remove from IndexedDB
  console.log('Removing stored action:', actionId)
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🎭 Mafia Game SW: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : '게임에 새로운 소식이 있습니다!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open-game',
        title: '게임 열기',
        icon: '/icons/action-open.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('🎭 마피아 게임', options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🎭 Mafia Game SW: Notification clicked:', event.action)
  
  event.notification.close()
  
  if (event.action === 'open-game') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('🎭 Mafia Game SW: Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

console.log('🎭 Mafia Game SW: Service Worker loaded successfully')