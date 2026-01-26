// Service Worker for offline caching
// Version: Auto-updated on build (see build script)
// IMPORTANT: Update BUILD_TIMESTAMP on each deployment to force cache invalidation

// Build timestamp - MUST be updated on each deployment
// Format: YYYYMMDDHHMMSS (e.g., 20250126143000)
const BUILD_TIMESTAMP = '20250126143000'

// Detect if we're in development mode (localhost)
const isDevelopment = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1' ||
                      self.location.hostname.includes('localhost')

// Cache name includes build timestamp for automatic invalidation
const CACHE_NAME = `moumousse-pet-sitting-${BUILD_TIMESTAMP}`

// Static assets to precache (only essential pages)
// NOTE: CSS is inlined by Astro, so we only cache HTML pages
const STATIC_ASSETS = [
  '/',
  '/index/',
]

// Install event - cache static assets (only in production)
self.addEventListener('install', (event) => {
  if (isDevelopment) {
    // In development, skip caching and activate immediately
    self.skipWaiting()
    return
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('Service Worker: Failed to cache some assets:', error)
      })
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (isDevelopment) {
    // In development, clear all caches and unregister
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        )
      }).then(() => {
        return self.clients.claim()
      })
    )
    return
  }

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all pages immediately
  return self.clients.claim()
})

// Fetch event - Network-first strategy (prioritize fresh content, cache as fallback)
self.addEventListener('fetch', (event) => {
  // In development, always fetch from network (no caching)
  if (isDevelopment) {
    return
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Network-first strategy: try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response (stream can only be consumed once)
        const responseToCache = response.clone()

        // Update cache with fresh content in background
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // If no cache and it's a document request, return offline page
          if (event.request.destination === 'document') {
            return caches.match('/').then((offlinePage) => {
              return offlinePage || new Response('Offline', { status: 503 })
            })
          }

          // Return error for other requests
          return new Response('Network error', { status: 503 })
        })
      })
  )
})
