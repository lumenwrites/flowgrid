const CACHE_VERSION = 'flowgrid-v8'

const PRECACHE_ASSETS = [
  '/',
  // Metronome
  '/tracks/metronome/60bpm.wav',
  '/tracks/metronome/80bpm.wav',
  '/tracks/metronome/100bpm.wav',
  '/tracks/metronome/120bpm.wav',
  // Villain Song
  '/tracks/villain-song-80bpm/loops/01-verse-8bars-80bpm.wav',
  '/tracks/villain-song-80bpm/loops/02-chorus-8bars-80bpm.wav',
  '/tracks/villain-song-80bpm/mixes/instrumental.wav',
  '/tracks/villain-song-80bpm/mixes/lyrics.wav',
  '/tracks/villain-song-80bpm/mixes/scat.wav',
  // Basic Drums (BPM variants)
  '/tracks/basic-drums/loops/01-verse-4bars-60bpm.wav',
  '/tracks/basic-drums/loops/01-verse-4bars-80bpm.wav',
  '/tracks/basic-drums/loops/01-verse-4bars-100bpm.wav',
  '/tracks/basic-drums/loops/01-verse-4bars-120bpm.wav',
  '/tracks/basic-drums/loops/02-chorus-4bars-60bpm.wav',
  '/tracks/basic-drums/loops/02-chorus-4bars-80bpm.wav',
  '/tracks/basic-drums/loops/02-chorus-4bars-100bpm.wav',
  '/tracks/basic-drums/loops/02-chorus-4bars-120bpm.wav',
  // Hoedown
  '/tracks/hoedown/loops/01-intro-4bars-120bpm.wav',
  '/tracks/hoedown/loops/02-verse-8bars-120bpm.wav',
  '/tracks/hoedown/loops/03-break-2bars-120bpm.wav',
  '/tracks/hoedown/mixes/instrumental.wav',
  // Other tracks
  '/tracks/scene-to-rap-100bpm/loops/01-loop-8bars-100bpm.m4a',
  '/tracks/ycca-80bpm/loops/01-loop-8bars-80bpm.m4a',
  // App assets
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

  // Everything else: cache-first, then network (cache on success)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          // Cache successful same-origin responses
          if (response.ok && request.url.startsWith(self.location.origin)) {
            const clone = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }))
    })
  )
})
