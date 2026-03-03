const CACHE_VERSION = 'flowgrid-v2'

const PRECACHE_ASSETS = [
  '/',
  '/data/word-lists.json',
  '/beats/drums-loop-60bpm.wav',
  '/beats/drums-loop-80bpm.wav',
  '/beats/drums-loop-100bpm.wav',
  '/beats/drums-loop-120bpm.wav',
  '/beats/metronome-loop-60bpm.wav',
  '/beats/metronome-loop-80bpm.wav',
  '/beats/metronome-loop-100bpm.wav',
  '/beats/metronome-loop-120bpm.wav',
  '/beats/scene-to-rap-loop-100bpm.m4a',
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
