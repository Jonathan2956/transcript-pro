/**
 * Service Worker - Progressive Web App features के लिए
 * Offline functionality, caching, और background sync के लिए
 */

const CACHE_NAME = 'transcriptpro-v1.2'; // Cache version
const API_CACHE_NAME = 'transcriptpro-api-v1'; // API cache

// Files to cache during installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/scripts/youtube-player.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/health',
  '/api/transcripts/',
  '/api/vocabulary/'
];

/**
 * Install Event - Service worker installation पर
 * Static assets cache करने के लिए
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker Installing...'); // Installation log
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets'); // Caching log
        return cache.addAll(STATIC_ASSETS); // Assets cache करें
      })
      .then(() => {
        console.log('✅ Service Worker Installed'); // Success log
        return self.skipWaiting(); // Immediate activation
      })
      .catch(error => {
        console.error('❌ Service Worker Installation Failed:', error); // Error log
      })
  );
});

/**
 * Activate Event - Service worker activation पर
 * Old caches clean करने के लिए
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker Activating...'); // Activation log
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Old caches delete करें
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName); // Deletion log
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker Activated'); // Success log
      return self.clients.claim(); // Immediate control
    })
  );
});

/**
 * Fetch Event - Network requests intercept करने के लिए
 * Caching strategy implement करने के लिए
 */
self.addEventListener('fetch', (event) => {
  // Non-GET requests ignore करें
  if (event.request.method !== 'GET') return;

  // YouTube and external resources ignore करें
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    this.handleFetch(event.request) // Fetch request handle करें
  );
});

/**
 * Fetch Request Handle करें - Caching strategy के according
 */
async function handleFetch(request) {
  try {
    // Network से fresh response fetch करने की try करें
    const networkResponse = await fetch(request);
    
    // Successful response पर cache करें
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone()); // Response cache करें
    }
    
    return networkResponse; // Fresh response return करें
    
  } catch (error) {
    // Network failure पर cache से serve करें
    console.log('🌐 Network failed, trying cache...'); // Fallback log
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse; // Cached response return करें
    }
    
    // Fallback response यदि cache में भी नहीं है
    return new Response(JSON.stringify({
      error: 'You are offline and this resource is not cached',
      suggestion: 'Please check your internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Background Sync - Offline actions sync करने के लिए
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered'); // Sync log
    event.waitUntil(this.doSync()); // Sync perform करें
  }
});

/**
 * Background Sync Perform करें - Pending actions process करें
 */
async function doSync() {
  try {
    // Pending actions get करें (localStorage से)
    const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
    
    for (const action of pendingActions) {
      try {
        // Action perform करें
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Successful action remove करें
        pendingActions.splice(pendingActions.indexOf(action), 1);
        localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
        
      } catch (error) {
        console.error('Sync action failed:', error); // Error log
      }
    }
    
    console.log('✅ Background sync completed'); // Success log
    
  } catch (error) {
    console.error('Background sync failed:', error); // Error log
  }
}

/**
 * Push Notifications Handle करें - User notifications के लिए
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json(); // Notification data parse करें
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag,
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options) // Notification show करें
  );
});

/**
 * Notification Click Handle करें - User interaction के लिए
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Notification close करें
  
  if (event.action === 'open') {
    // App open करें
    event.waitUntil(
      clients.openWindow('/') // Main app open करें
    );
  }
});

console.log('🔧 Service Worker Loaded'); // Load completion log
