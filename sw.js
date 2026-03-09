const CACHE_NAME = 'qltc-v6.16';
const LOCAL_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(LOCAL_ASSETS);
      await Promise.allSettled(
        CDN_ASSETS.map(url =>
          fetch(url).then(res => { if(res.ok) cache.put(url, res); }).catch(()=>{})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isCDN = CDN_ASSETS.some(cdn => url.includes('chart.umd.min.js') || url.includes('fonts.googleapis'));

  if (isCDN) {
    // Cache-first for CDN resources
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
  } else {
    // Cache-first for local assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if(res.ok){const clone=res.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));}
        return res;
      }))
    );
  }
});
