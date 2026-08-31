const CACHE_NAME = 'refuselink-install-v1'
const INSTALL_ASSETS = ['/favicon.svg', '/pwa-icon.svg', '/pwa-icon-192.png', '/pwa-icon-512.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(INSTALL_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin || !INSTALL_ASSETS.includes(url.pathname)) return
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)))
})
