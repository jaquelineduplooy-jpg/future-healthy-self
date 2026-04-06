const CACHE = 'fhs-v2'
const OFFLINE = ['/', '/planner', '/shopping', '/tracker', '/dashboard', '/exercise', '/calendar', '/ocr']

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(OFFLINE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // don't block install if a route 404s
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('/api/')) return
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request).then(r => r ?? caches.match('/')))
  )
})
