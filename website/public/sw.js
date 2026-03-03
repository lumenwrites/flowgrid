const CACHE_VERSION = 'flowgrid-v4'

const PRECACHE_ASSETS = [
  '/',
  '/data/word-lists.json',
  '/loops/drums-loop-60bpm.wav',
  '/loops/drums-loop-80bpm.wav',
  '/loops/drums-loop-100bpm.wav',
  '/loops/drums-loop-120bpm.wav',
  '/loops/metronome-loop-60bpm.wav',
  '/loops/metronome-loop-80bpm.wav',
  '/loops/metronome-loop-100bpm.wav',
  '/loops/metronome-loop-120bpm.wav',
  '/loops/scene-to-rap-loop-100bpm.m4a',
  '/loops/ycca-80bpm-8bars.m4a',
  '/loops/freestyle-drums-100bpm-4bars.wav',
  '/img/logo.png',
  '/img/background-tile.webp',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Navigation requests: network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // Everything else: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // Cache successful same-origin responses
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
