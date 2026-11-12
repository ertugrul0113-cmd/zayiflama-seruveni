// Önce internet, olmazsa önbellek: yeni sürüm telefona kendiliğinden gelir, internetsiz de açılır.
var ONBELLEK = 'seruven-v3';
var DOSYALAR = ['./', 'index.html', 'style.css', 'app.js', 'calc.js', 'foods.js', 'store.js', 'tarif-veri.js', 'ai.js', 'barkod.js', 'egzersiz.js',
  'oruc.js', 'ilerleme.js', 'tarifler.js', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(ONBELLEK).then(function (c) { return c.addAll(DOSYALAR); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== ONBELLEK; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r, { cache: 'no-cache' }).then(function (cevap) {
      if (cevap.ok) { var kopya = cevap.clone(); caches.open(ONBELLEK).then(function (c) { c.put(r, kopya); }); }
      return cevap;
    }).catch(function () {
      return caches.match(r, { ignoreSearch: true }).then(function (m) { return m || caches.match('index.html'); });
    })
  );
});
