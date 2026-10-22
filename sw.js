/* MedicSim LA service worker: makes the app fully usable offline.
 * - App shell (HTML with all scenarios, icons, manifest, Vosk speech engine) is precached on install.
 * - Downloaded models (Moonshine speech recognizer + Vosk backup, optional MiniLM) live in "medicsim-models-v1" and survive app updates.
 * - Cache-first for everything same-origin; network results are added to the app cache. */
const VERSION = "ff18ca2cf4";
const APP_CACHE = "medicsim-app-" + VERSION;
const MODEL_CACHE = "medicsim-models-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "vendor/vosk.js", "asr-worker.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("medicsim-app-") && k !== APP_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    // app shell: cached copy first (instant + offline), refresh in the background when online
    e.respondWith(caches.open(APP_CACHE).then(async c => {
      const hit = await c.match("index.html");
      const net = fetch(req).then(r => { if (r.ok) c.put("index.html", r.clone()); return r; }).catch(() => null);
      return hit || (await net) || new Response("<h1>Offline</h1><p>Open MedicSim once while online to install it.</p>", { headers: { "content-type": "text/html" } });
    }));
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true }); // searches app + model caches
    if (hit) return hit;
    try {
      const r = await fetch(req);
      const big = /\/models\//.test(url.pathname) || /\.wasm$/.test(url.pathname) || /transformers/.test(url.pathname);
      if (r.ok && !big && r.type === "basic") (await caches.open(APP_CACHE)).put(req, r.clone());
      return r;
    } catch (err) {
      return new Response("", { status: 504, statusText: "offline and not cached" });
    }
  })());
});
