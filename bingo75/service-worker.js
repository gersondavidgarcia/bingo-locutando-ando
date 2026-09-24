/* ============================================
   SERVICE WORKER - Bingo Tradicional
   Permite que la app funcione offline y cargue rápido.
   ============================================ */
const CACHE_NAME = 'bingo-tradicional-v3';

// Archivos que se guardan para funcionar sin internet
const ARCHIVOS_CACHE = [
    './',
    './index.html',
    './juego.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icono-192.png',
    './icono-512.png'
];

/* --------------------------------------------
   INSTALACIÓN: guardar archivos en caché
   -------------------------------------------- */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Cacheando archivos...');
            return cache.addAll(ARCHIVOS_CACHE).catch((err) => {
                console.warn('⚠️ Algunos archivos no se pudieron cachear:', err);
            });
        })
    );
    // Activar el nuevo SW inmediatamente sin esperar
    self.skipWaiting();
});

/* --------------------------------------------
   ACTIVACIÓN: limpiar cachés viejos
   -------------------------------------------- */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('🗑️ Borrando caché viejo:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    // Tomar control de las pestañas abiertas sin recargar
    self.clients.claim();
});

/* --------------------------------------------
   FETCH: servir desde caché, si no desde internet
   -------------------------------------------- */
self.addEventListener('fetch', (event) => {
    // Solo manejamos peticiones GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((respuestaCache) => {
            if (respuestaCache) {
                // Está en caché → devolverlo al instante
                return respuestaCache;
            }

            // No está en caché → ir a internet
            return fetch(event.request)
                .then((respuestaRed) => {
                    // Guardar copia para la próxima vez (opcional)
                    if (respuestaRed && respuestaRed.status === 200) {
                        const copia = respuestaRed.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, copia);
                        });
                    }
                    return respuestaRed;
                })
                .catch(() => {
                    // Sin internet y sin caché → si es navegación, mostrar index
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});
