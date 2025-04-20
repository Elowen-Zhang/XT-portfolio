/**
 * Service Worker Documentation - responsible for caching website resources and providing offline accessibility
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `elowen-portfolio-${CACHE_VERSION}`;

const getBasePath = () => {
  return self.location.pathname.replace(/\/[^\/]*$/, '/');
};

const urlsToCache = [
  getBasePath(),
  getBasePath() + 'index.html',
  getBasePath() + 'variation.html',
  getBasePath() + 'amiam.html',
  getBasePath() + 'Room.html',
  getBasePath() + 'Mirage.html',
  getBasePath() + 'Paradise.html',
  getBasePath() + 'Reminisce.html',
  getBasePath() + 'assets/images/Variation_pic1.png',
  getBasePath() + 'assets/images/amiam_pic1.png',
  getBasePath() + 'assets/images/room_PIC1.png',
  getBasePath() + 'assets/images/Reminisce_pic1.png',
  getBasePath() + 'assets/images/Paradise_pic1.png',
  getBasePath() + 'assets/images/Mirage_pic1.png',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已打开缓存');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) 
  );
});


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('elowen-portfolio-') && cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) 
  );
});


self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.endsWith('.mp4')) {
    return;
  }
  
  const url = new URL(event.request.url);
  if (!url.origin.includes('github.io') && 
      !url.origin.includes('localhost') && 
      !url.origin.includes('127.0.0.1') &&
      !url.origin.includes('cdn.tailwindcss.com')) {
    return;
  }
  
  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('网络请求失败:', error);
    return new Response('Network error', { status: 408, headers: new Headers({ 'Content-Type': 'text/plain' }) });
  }
} 
