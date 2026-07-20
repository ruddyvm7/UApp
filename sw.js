/* UApp · Service Worker v4
   Cambio clave respecto a v3: los datos en vivo (avisos de Supabase) YA NO se guardan
   en caché. Antes se servían desde la copia guardada y por eso los avisos publicados
   o eliminados no se veían hasta limpiar el navegador. */
const CACHE = "uapp-v4";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const sameOrigin = (url.origin === self.location.origin);

  /* 1) DATOS EN VIVO (Supabase: avisos, sesión). Siempre desde la red, nunca desde caché. */
  const isAPI = /supabase\.co$/i.test(url.hostname)
             || /\/rest\/v1\//.test(url.pathname)
             || /\/auth\/v1\//.test(url.pathname)
             || /\/storage\/v1\//.test(url.pathname);
  if (isAPI) { e.respondWith(fetch(req)); return; }

  /* 2) DOCUMENTOS (la app, el panel, PDFs abiertos directo): red primero.
        La copia guardada solo se usa si no hay conexión. */
  const isDoc = req.mode === "navigate"
             || req.destination === "document"
             || /\.html?$/i.test(url.pathname)
             || /\/$/.test(url.pathname);
  if (isDoc) {
    e.respondWith(
      fetch(req).then(resp => {
        if (sameOrigin && resp && resp.ok) {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  /* 3) ARCHIVOS QUE CAMBIAN (PDF y otros documentos publicados): red primero,
        para que una versión corregida se vea de inmediato. */
  if (/\.(pdf|docx?|xlsx?|pptx?|csv)$/i.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(resp => {
        if (sameOrigin && resp && resp.ok) {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return resp;
      }).catch(() => caches.match(req))
    );
    return;
  }

  /* 4) RECURSOS ESTÁTICOS (iconos, fuentes, librerías): se entrega la copia guardada
        al instante y se actualiza en segundo plano para la próxima visita. */
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(resp => {
        if (resp && (resp.ok || resp.type === "opaque")) {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return resp;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
