/**
 * Service Worker文件 - 负责缓存网站资源和提供离线访问能力
 */

// 缓存版本号 - 更新网站时需要修改此值
const CACHE_VERSION = 'v1';
const CACHE_NAME = `elowen-portfolio-${CACHE_VERSION}`;

// 需要预缓存的资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/variation.html',
  '/amiam.html',
  '/Room.html',
  '/Mirage.html',
  '/Paradise.html',
  '/Reminisce.html',
  '/assets/images/Variation_pic1.png',
  '/assets/images/amiam_pic1.png',
  '/assets/images/room_PIC1.png',
  '/assets/images/Reminisce_pic1.png',
  '/assets/images/Paradise_pic1.png',
  '/assets/images/Mirage_pic1.png',
  'https://cdn.tailwindcss.com'
];

// 安装事件处理 - 预缓存关键资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('已打开缓存');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 确保新的Service Worker立即激活
  );
});

// 激活事件处理 - 清理旧缓存
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
    }).then(() => self.clients.claim()) // 控制未控制的客户端
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  // 只处理GET请求
  if (event.request.method !== 'GET') return;
  
  // 排除第三方请求（YouTube, Vimeo等）
  const url = new URL(event.request.url);
  if (!url.origin.includes('github.io') && 
      !url.origin.includes('localhost') && 
      !url.origin.includes('127.0.0.1') &&
      !url.origin.includes('cdn.tailwindcss.com')) {
    return;
  }
  
  // 视频文件使用网络优先策略
  if (event.request.url.endsWith('.mp4')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // 对于其他资源，使用缓存优先策略
  event.respondWith(cacheFirst(event.request));
});

// 缓存优先，网络回退策略
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    // 如果请求成功，缓存响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 如果网络请求失败，返回一个基本的失败响应
    console.log('网络请求失败:', error);
    return new Response('Network error', { status: 408, headers: new Headers({ 'Content-Type': 'text/plain' }) });
  }
}

// 网络优先，缓存回退策略
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    // 如果请求成功，缓存响应
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // 如果网络请求失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // 如果缓存也没有，返回一个基本的失败响应
    return new Response('Network error', { status: 408, headers: new Headers({ 'Content-Type': 'text/plain' }) });
  }
} 