const CACHE_NAME = 'roleta-v4-cache';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/favicon-32.png',
    './css/global.css',
    './css/components.css',
    './css/roleta.css',
    './js/utils.js',
    './js/config.js',
    './js/auth.js',
    './js/audio.js',
    './js/confetti.js',
    './js/storage.js',
    './js/roleta.js',
    './js/cadastro.js',
    './js/admin.js',
    './js/app.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : Promise.resolve())
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(request).catch(() => new Response(
                JSON.stringify({ offline: true }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
            ))
        );
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copia = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                    return response;
                })
                .catch(() => caches.match(request).then((cacheado) => cacheado || caches.match('./index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cacheado) => {
            if (cacheado) return cacheado;

            return fetch(request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const copia = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
                return response;
            });
        })
    );
});
