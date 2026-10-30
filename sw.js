/* UApp · Service Worker v5
   Cambio clave respecto a v4: los archivos con versión (?v=…) —el código y el diseño de cada
   sección, los mazos de Estudiar y el logo— se guardan en su propia caché («uapp-recursos»),
   que sobrevive a las actualizaciones de este archivo. Como su dirección cambia cada vez que
   cambian, nunca se mezcla una versión vieja con una nueva.
   Se mantiene lo de v4: los datos en vivo (avisos de Supabase) nunca se guardan en caché. */
const CACHE = "uapp-v5";
const RECURSOS = "uapp-recursos";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    try { const c = await caches.open(CACHE); await c.addAll(ASSETS); } catch (_) {}
    /* los archivos con versión que usa la página actual, para que funcione sin conexión desde la primera visita */
    try {
      const html = await (await fetch("./index.html", { cache: "no-cache" })).text();
      const urls = [...html.matchAll(/(?:src|href)="([^"?#:]+\?v=[0-9a-f]+)"/g)].map(m => new URL(m[1], self.registration.scope).href);
      const rc = await caches.open(RECURSOS);
      await Promise.all(urls.map(u => rc.match(u).then(hit => hit || rc.add(u)).catch(() => {})));
    } catch (_) {}
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE && k !== RECURSOS).map(k => caches.delete(k)));
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

  /* 3) ARCHIVOS CON VERSIÓN (?v=…): una dirección = un contenido que no cambia. Se entrega lo
        guardado en el teléfono; si no está, se descarga y se guarda en «uapp-recursos». */
  if (sameOrigin && url.searchParams.has("v")) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(resp => {
        if (resp && resp.ok) {
          const cp = resp.clone();
          caches.open(RECURSOS).then(c => c.put(req, cp));
        }
        return resp;
      }))
    );
    return;
  }

  /* 4) ARCHIVOS QUE CAMBIAN (PDF y otros documentos publicados): red primero,
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

  /* 5) RECURSOS ESTÁTICOS (iconos, fuentes, librerías): se entrega la copia guardada
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
