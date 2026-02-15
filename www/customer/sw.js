const CACHE = "pizza-olive-customer-v149";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles-enhanced.css",
  "./../js/app.js",
  "./manifest.webmanifest",
  "./assets/olive-icon.svg",
  "./assets/olive-icon-192.png",
  "./assets/olive-icon-512.png",
  "./assets/pizza-xl.svg",
  "./assets/pasta.svg",
  "./assets/t_corn.svg",
  "./assets/t_mush.svg",
  "./assets/t_olives.svg",
  "./assets/t_tomato.svg",
  "./assets/s_cream.svg",
  "./assets/s_rose.svg",
  "./assets/s_tomato.svg",
  "./assets/banner_pizza.svg",
  "./assets/banner_pasta.svg",
  "./assets/banner_salad.svg",
  "./assets/banner_bakery.svg",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k===CACHE ? null : caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).catch(()=>caches.match("./index.html")))
  );
});