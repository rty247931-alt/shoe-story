// Service Worker — يخلي المتجر قابل للتثبيت ويشتغل بسرعة أكبر.
// مهم: أي طلب لـ /api/ بيروح للسيرفر مباشرة دايماً (منتجات، طلبات، حسابات)
// عشان البيانات تفضل محدّثة ومحدش يشوف بيانات قديمة أو يعمل طلب وهو مقفول عليه.

const CACHE_NAME = 'shoe-store-v1';

// الملفات الأساسية اللي بنحملها مقدماً عشان الموقع يفتح بسرعة حتى لو النت ضعيف
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/store.html',
  '/cart.html',
  '/login.html',
  '/css/style.css',
  '/js/common.js',
  '/js/api.js',
  '/js/cart.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // مسارات الـ API والرفع: من السيرفر دايماً، بدون كاش، عشان البيانات تفضل لايف
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return; // سيب المتصفح يتعامل معها عادي (network)
  }

  if (request.method !== 'GET') return;

  // باقي الملفات الثابتة (HTML/CSS/JS/صور): جرب الكاش الأول، وحدّثه في الخلفية
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
