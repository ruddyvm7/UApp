/* UApp · Service Worker v6
   v5: los archivos con versión (?v=…) —el código y el diseño de cada sección, los mazos de Estudiar y el
   logo— se guardan en su propia caché («uapp-recursos»), que sobrevive a las actualizaciones de este archivo.
   Como su dirección cambia cada vez que cambian, nunca se mezcla una versión vieja con una nueva.
   v6 (v2.8.1), por la revisión técnica:
   · la app se guarda una sola vez, sin los parámetros del enlace (?derechotech, ?x=…): antes cada enlace
     distinto dejaba otra copia;
   · solo se guardan respuestas correctas del propio sitio (o de servidores que lo permiten): nada opaco ni
     páginas de error o de un wifi con portal de acceso disfrazadas del archivo pedido;
   · el panel de la directiva y la página de la coordinación quedan fuera: siempre desde internet, sin copia;
   · ya no se precargan íconos que el manifiesto no usa;
   · un archivo con versión se entrega solo si su contenido corresponde a su versión (huella SHA-1).
   Se mantiene: los datos en vivo (Supabase) nunca se guardan en caché. */
const CACHE = "uapp-v6";
const RECURSOS = "uapp-recursos";
const FUERA = /\/(panel-admin\.html|carga-2026\/)/;   /* páginas de la directiva y de la coordinación */

/* ¿la respuesta es el archivo pedido? (no un error, una redirección ni una página HTML en lugar de un script) */
function sirve(resp, html) {
  if (!resp || !resp.ok || resp.redirected) return false;
  if (resp.type !== "basic" && resp.type !== "cors") return false;
  const tipo = resp.headers.get("content-type") || "";
  return html ? /text\/html/i.test(tipo) : !/text\/html/i.test(tipo);
}
/* documentos del propio sitio (la app o un PDF abierto directo): respuesta correcta y sin redirección */
function sirveDoc(resp) { return !!resp && resp.ok && !resp.redirected && resp.type === "basic"; }
/* la app se guarda con su ruta, sin parámetros ni #: /?derechotech y /?x=1 son la misma copia de / */
function claveDoc(url) { return url.origin + url.pathname; }
/* El número de versión (?v=…) es el comienzo de la huella SHA-1 del archivo (la calcula _desarrollo/versionar.py).
   Antes de entregar o guardar un archivo con versión se comprueba que su contenido es ese: una copia alterada
   o dañada en el teléfono se descarta y se vuelve a bajar */
async function huella(resp) {
  const h = await crypto.subtle.digest("SHA-1", await resp.clone().arrayBuffer());
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}
async function conVersion(req, url) {
  const v = url.searchParams.get("v"), rc = await caches.open(RECURSOS);
  const hit = await rc.match(req);
  if (hit) {
    try { if (await huella(hit) === v) return hit; } catch (_) { return hit; }
    await rc.delete(req);
  }
  const resp = await fetch(req);
  if (sirve(resp, false)) {
    try { if (await huella(resp) === v) await rc.put(req, resp.clone()); } catch (_) {}
  }
  return resp;
}

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try { await c.add("./manifest.json"); } catch (_) {}
    /* la app y los archivos con versión que usa, para que funcione sin conexión desde la primera visita */
    try {
      const resp = await fetch("./index.html", { cache: "no-cache" });
      if (!sirve(resp, true)) return;
      const html = await resp.clone().text();
      await c.put(new URL("./index.html", self.registration.scope).href, resp);
      const urls = [...html.matchAll(/(?:src|href)="([^"?#:]+\?v=[0-9a-f]+)"/g)].map(m => new URL(m[1], self.registration.scope).href);
      const rc = await caches.open(RECURSOS);
      await Promise.all(urls.map(u => rc.match(u).then(hit => hit || fetch(u).then(async r => {
        if (sirve(r, false) && await huella(r) === new URL(u).searchParams.get("v")) return rc.put(u, r);
      })).catch(() => {})));
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

  /* 0) Panel y coordinación: el navegador los pide directo, sin pasar por la caché */
  if (sameOrigin && FUERA.test(url.pathname)) return;

  /* 1) DATOS EN VIVO (Supabase: avisos, sesión). Siempre desde la red, nunca desde caché. */
  const isAPI = /supabase\.co$/i.test(url.hostname)
             || /\/rest\/v1\//.test(url.pathname)
             || /\/auth\/v1\//.test(url.pathname)
             || /\/storage\/v1\//.test(url.pathname);
  if (isAPI) { e.respondWith(fetch(req)); return; }

  /* 2) DOCUMENTOS (la app y PDFs abiertos directo): red primero. La copia guardada solo se usa si no hay conexión. */
  const isDoc = req.mode === "navigate"
             || req.destination === "document"
             || /\.html?$/i.test(url.pathname)
             || /\/$/.test(url.pathname);
  if (isDoc) {
    const clave = claveDoc(url);
    e.respondWith(
      fetch(req).then(resp => {
        if (sameOrigin && sirveDoc(resp)) {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(clave, cp));
        }
        return resp;
      }).catch(() => caches.match(clave, { ignoreSearch: true })
        .then(r => r || caches.match(new URL("./index.html", self.registration.scope).href)))
    );
    return;
  }

  /* 3) ARCHIVOS CON VERSIÓN (?v=…): una dirección = un contenido que no cambia. Se entrega lo
        guardado en el teléfono; si no está, se descarga y se guarda en «uapp-recursos». */
  if (sameOrigin && url.searchParams.has("v")) {
    e.respondWith(conVersion(req, url).catch(() => caches.match(req)));
    return;
  }

  /* 4) ARCHIVOS QUE CAMBIAN (PDF y otros documentos publicados): red primero,
        para que una versión corregida se vea de inmediato. */
  if (/\.(pdf|docx?|xlsx?|pptx?|csv)$/i.test(url.pathname)) {
    e.respondWith(
      fetch(req).then(resp => {
        if (sameOrigin && sirve(resp, false)) {
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
        if (sirve(resp, false)) {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(req, cp));
        }
        return resp;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
