/*
 * Service Worker.
 *
 * Что было сломано:
 *  1. cache.addAll() получал список с /icon-192x192.png и /icon-512x512.png,
 *     которых в public/ не существовало. addAll атомарен: один 404 отклоняет
 *     весь промис, установка падает — и Service Worker не активировался
 *     НИКОГДА. PWA не работал целиком.
 *  2. В notificationclick вызывался `clients` без self — ReferenceError.
 *  3. Стратегия «сначала сеть» применялась и к статике с хешем в имени,
 *     хотя такие файлы неизменяемы и их достаточно взять из кэша.
 */

const VERSION = 'v2';
const SHELL_CACHE = `shell-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;

// Только то, что точно существует. Остальное осядет в кэше по ходу работы.
const SHELL_ASSETS = ['/', '/index.html', '/manifest.json', '/logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // Каждый ресурс кладётся отдельно: отсутствие одного файла
        // больше не отменяет установку целиком
        Promise.all(
          SHELL_ASSETS.map((url) =>
            cache.add(url).catch(() => {
              /* ресурса нет — пропускаем */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== SHELL_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Чужие домены (Supabase, шрифты) обслуживает браузер
  if (url.origin !== self.location.origin) return;

  // Собранная статика содержит хеш в имени — она неизменяема,
  // отдаём из кэша сразу и не ходим в сеть
  const isImmutable = url.pathname.startsWith('/assets/');

  if (isImmutable) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Остальное — сначала сеть, при отсутствии связи из кэша
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await caches.match('/index.html');
          if (shell) return shell;
        }
        return new Response('Нет соединения', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Новый материал', {
      body: data.body || 'В журнале появился новый материал',
      icon: '/logo.svg',
      badge: '/logo.svg',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Открыть' },
        { action: 'close', title: 'Закрыть' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const target = event.notification.data?.url || '/';

  // Именно self.clients: голый `clients` — ReferenceError в модульном воркере
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
