/* v2.8.2 · Service worker (sw.js) sin navegador: se carga en Node con una red y unas cachés de mentira.
   La «red» sirve los archivos reales del repositorio, así que también se prueba que la app y sus archivos con
   versión (?v=…) calcen con lo que sw.js precarga. Revisa: instalación sin conexión desde la primera visita,
   limpieza de cachés viejas, qué se guarda y qué no (errores, redirecciones, portales de wifi, respuestas opacas,
   datos en vivo), copias alteradas o vencidas, y que el panel y la coordinación queden fuera. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const R = []; const ok = (n, c) => R.push((c ? '✅' : '❌') + ' ' + n);
const RAIZ = path.join(__dirname, '..', '..');
const ORIGEN = 'https://miuapp.cl';
const SUPA = 'https://pohrbljeamhfkcjxikct.supabase.co';
const TIPOS = { html: 'text/html; charset=utf-8', js: 'application/javascript', css: 'text/css', json: 'application/json',
  png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2', pdf: 'application/pdf', ico: 'image/x-icon' };

/* Respuesta mínima con lo que sw.js mira: ok, status, type, redirected, content-type y el cuerpo */
class Resp {
  constructor(cuerpo, { status = 200, type = 'basic', redirected = false, ctype = 'text/plain' } = {}) {
    this.cuerpo = Buffer.from(cuerpo); this.status = status; this.ok = status >= 200 && status < 300;
    this.type = type; this.redirected = redirected; this.ctype = ctype;
    this.headers = { get: k => (String(k).toLowerCase() === 'content-type' ? ctype : null) };
  }
  clone() { return new Resp(this.cuerpo, { status: this.status, type: this.type, redirected: this.redirected, ctype: this.ctype }); }
  async arrayBuffer() { return this.cuerpo.buffer.slice(this.cuerpo.byteOffset, this.cuerpo.byteOffset + this.cuerpo.length); }
  async text() { return this.cuerpo.toString('utf8'); }
}
const pedido = (url, o = {}) => ({ url: new URL(url, ORIGEN + '/').href, method: o.method || 'GET', mode: o.mode || 'no-cors', destination: o.destination || '' });

/* Cachés en memoria con la misma forma que las del navegador */
class Cache {
  constructor() { this.m = new Map(); }
  clave(r) { return typeof r === 'string' ? new URL(r, ORIGEN + '/').href : r.url; }
  async match(r, o) {
    const k = this.clave(r);
    if (o && o.ignoreSearch) { for (const [kk, v] of this.m) if (kk.split('?')[0] === k.split('?')[0]) return v.clone(); return undefined; }
    const v = this.m.get(k); return v ? v.clone() : undefined;
  }
  async put(r, resp) { this.m.set(this.clave(r), resp.clone()); }
  async delete(r) { return this.m.delete(this.clave(r)); }
  async add(r) { const resp = await red(pedido(this.clave(r))); if (!resp.ok) throw new TypeError('add'); await this.put(r, resp); }
}
let cajas = new Map();
const caches = {
  async open(n) { if (!cajas.has(n)) cajas.set(n, new Cache()); return cajas.get(n); },
  async keys() { return [...cajas.keys()]; },
  async delete(n) { return cajas.delete(n); },
  async match(r, o) { for (const c of cajas.values()) { const v = await c.match(r, o); if (v) return v; } return undefined; },
};

/* La red: archivos del repositorio, Supabase de mentira y casos especiales. sinRed = sin conexión */
let sinRed = false, especiales = new Map(), pedidos = [];
async function red(req) {
  const url = typeof req === 'string' ? new URL(req, ORIGEN + '/').href : req.url;
  pedidos.push(url);
  if (sinRed) throw new TypeError('Failed to fetch');
  if (especiales.has(url)) return especiales.get(url)();
  const u = new URL(url);
  if (u.origin === SUPA) return new Resp('[]', { type: 'cors', ctype: 'application/json' });
  if (u.origin !== ORIGEN) return new Resp('', { status: 0, type: 'opaque' });
  let ruta = decodeURIComponent(u.pathname); if (ruta.endsWith('/')) ruta += 'index.html';
  const f = path.join(RAIZ, ruta);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return new Resp('No encontrado', { status: 404, ctype: TIPOS.html });
  return new Resp(fs.readFileSync(f), { ctype: TIPOS[path.extname(f).slice(1)] || 'application/octet-stream' });
}

/* Carga sw.js como lo haría el navegador */
const oyentes = {};
const self = {
  location: { origin: ORIGEN }, registration: { scope: ORIGEN + '/' },
  skipWaiting() {}, clients: { claim: async () => {} },
  addEventListener(t, f) { oyentes[t] = f; },
};
vm.createContext(Object.assign(self, { self, caches, fetch: red, crypto: globalThis.crypto, URL, Promise, console }));
/* opcional: otra copia de sw.js (para comprobar que estas pruebas detectan un cambio que rompe algo) */
vm.runInContext(fs.readFileSync(process.argv[2] || path.join(RAIZ, 'sw.js'), 'utf8'), self, { filename: 'sw.js' });
const CACHE = vm.runInContext('CACHE', self), RECURSOS = vm.runInContext('RECURSOS', self);

const pausa = () => new Promise(r => setTimeout(r, 5));
async function ciclo(tipo) { const esperas = []; oyentes[tipo]({ waitUntil: p => esperas.push(p) }); await Promise.all(esperas); }
/* devuelve null si sw.js deja pasar el pedido (no llama a respondWith) */
async function pedir(url, o) {
  let r; oyentes.fetch({ request: pedido(url, o), respondWith: p => { r = p; } });
  if (r === undefined) return null;
  const resp = await r; await pausa(); await pausa(); return resp;
}
const huella = buf => require('crypto').createHash('sha1').update(buf).digest('hex').slice(0, 12);
const texto = async r => (r ? r.text() : null);

(async () => {
  const INDEX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const conV = [...INDEX.matchAll(/(?:src|href)="([^"?#:]+\?v=[0-9a-f]+)"/g)].map(m => new URL(m[1], ORIGEN + '/').href);
  ok('sw.js usa una caché con número de versión y otra para los archivos con versión', /^uapp-v\d+$/.test(CACHE) && RECURSOS === 'uapp-recursos');
  ok('index.html usa archivos con versión (?v=…) para que sw.js los precargue', conV.length >= 7);

  /* ── instalación (primera visita) ── */
  cajas.set('uapp-v6', new Cache()); cajas.set('uapp-v5', new Cache());
  (await caches.open(RECURSOS)).put(ORIGEN + '/estudiar/estudiar.js?v=000000000000', new Resp('viejo'));
  await ciclo('install');
  const app = await caches.open(CACHE), rec = await caches.open(RECURSOS);
  ok('Instalación: guarda la app para abrirla sin conexión', !!(await app.match(ORIGEN + '/index.html')));
  ok('Instalación: guarda el manifiesto', !!(await app.match(ORIGEN + '/manifest.json')));
  ok('Instalación: guarda la letra Nunito del propio sitio', !!(await app.match(ORIGEN + '/fuentes/nunito-latin-wght-normal.woff2')));
  let todos = true, calzan = true;
  for (const u of conV) {
    const r = await rec.match(u); if (!r) { todos = false; continue; }
    if (huella(Buffer.from(await r.arrayBuffer())) !== new URL(u).searchParams.get('v')) calzan = false;
  }
  ok('Instalación: guarda los ' + conV.length + ' archivos con versión que usa la app', todos);
  ok('Instalación: cada archivo guardado corresponde a su versión (huella SHA-1)', calzan);
  ok('Instalación: no guarda páginas de otros sitios ni archivos sin versión', [...app.m.keys(), ...rec.m.keys()].every(k => k.startsWith(ORIGEN + '/')));

  await ciclo('activate');
  ok('Al activarse borra las cachés de versiones anteriores', !cajas.has('uapp-v6') && !cajas.has('uapp-v5') && cajas.has(CACHE) && cajas.has(RECURSOS));

  /* ── la app (documentos): red primero, copia sin parámetros, copia si no hay conexión ── */
  let r = await pedir('/?derechotech', { mode: 'navigate', destination: 'document' });
  ok('App: con conexión se descarga de nuevo', r && r.ok && (await texto(r)).includes('<html'));
  ok('App: el enlace con ?derechotech no deja otra copia (se guarda como /)', app.m.has(ORIGEN + '/') && ![...app.m.keys()].some(k => k.includes('?')));
  sinRed = true;
  r = await pedir('/?x=1', { mode: 'navigate', destination: 'document' });
  ok('App: sin conexión se abre la copia guardada', r && (await texto(r)).includes('<html'));
  r = await pedir('/una-ruta-cualquiera', { mode: 'navigate', destination: 'document' });
  ok('App: sin conexión, cualquier ruta abre la app guardada', r && (await texto(r)).includes('<html'));
  sinRed = false;
  const buena = await texto(await app.match(ORIGEN + '/'));
  especiales.set(ORIGEN + '/', () => new Resp('Error del servidor', { status: 500, ctype: TIPOS.html }));
  r = await pedir('/', { mode: 'navigate', destination: 'document' });
  ok('App: un error del servidor no reemplaza la copia buena', r && r.status === 500 && (await texto(await app.match(ORIGEN + '/'))) === buena);
  especiales.set(ORIGEN + '/', () => new Resp('<html>Portal del wifi: inicia sesión</html>', { redirected: true, ctype: TIPOS.html }));
  r = await pedir('/', { mode: 'navigate', destination: 'document' });
  ok('App: la página de un wifi con portal (redirección) no reemplaza la copia buena', (await texto(await app.match(ORIGEN + '/'))) === buena);
  especiales.clear();

  /* ── datos en vivo de Supabase: nunca en caché ── */
  const antes = [...cajas.values()].reduce((n, c) => n + c.m.size, 0);
  r = await pedir(SUPA + '/rest/v1/avisos?select=*', { mode: 'cors' });
  ok('Supabase: los avisos van siempre a la red', r && r.type === 'cors' && pedidos[pedidos.length - 1].startsWith(SUPA));
  r = await pedir(SUPA + '/storage/v1/object/public/documentos/avisos/x.pdf', { mode: 'cors' });
  ok('Supabase: ni datos ni adjuntos del depósito quedan guardados en el teléfono', [...cajas.values()].reduce((n, c) => n + c.m.size, 0) === antes);

  /* ── archivos con versión ── */
  const js = conV.find(u => /estudiar\.js\?v=/.test(u));
  pedidos = []; r = await pedir(js, { destination: 'script' });
  ok('Con versión: se entrega lo guardado, sin ir a la red', r && r.ok && pedidos.length === 0);
  await rec.put(js, new Resp('alert("alterado")', { ctype: TIPOS.js }));
  pedidos = []; r = await pedir(js, { destination: 'script' });
  const deNuevo = await rec.match(js);
  ok('Con versión: una copia alterada en el teléfono se descarta y se vuelve a bajar',
    r && !(await texto(r)).includes('alterado') && pedidos.length === 1 && huella(Buffer.from(await deNuevo.arrayBuffer())) === new URL(js).searchParams.get('v'));
  const otro = ORIGEN + '/estudiar/estudiar.js?v=abcdefabcdef';
  r = await pedir(otro, { destination: 'script' });
  ok('Con versión: si la red entrega otro contenido (versión vieja o alterada), no se guarda', r && !(await rec.match(otro)));
  sinRed = true; r = await pedir(js, { destination: 'script' }); sinRed = false;
  ok('Con versión: sin conexión se usa la copia guardada', r && r.ok);

  /* ── páginas fuera de la caché y pedidos que no son GET ── */
  ok('El panel de la directiva no pasa por la caché', (await pedir('/panel-admin.html', { mode: 'navigate', destination: 'document' })) === null);
  ok('La página de la coordinación no pasa por la caché', (await pedir('/carga-2026/', { mode: 'navigate', destination: 'document' })) === null);
  ok('Un envío (POST) no pasa por la caché', (await pedir(SUPA + '/rest/v1/consultas', { method: 'POST', mode: 'cors' })) === null);
  ok('Direcciones que no son http(s) no pasan por sw.js', (await pedir('chrome-extension://abc/x.js')) === null);

  /* ── documentos que cambian (PDF): red primero, copia sin conexión ── */
  especiales.set(ORIGEN + '/docs/calendario.pdf', () => new Resp('%PDF-1.7 versión 1', { ctype: TIPOS.pdf }));
  r = await pedir('/docs/calendario.pdf');
  especiales.set(ORIGEN + '/docs/calendario.pdf', () => new Resp('%PDF-1.7 versión 2', { ctype: TIPOS.pdf }));
  r = await pedir('/docs/calendario.pdf');
  ok('PDF: con conexión se ve la versión corregida al tiro', (await texto(r)).includes('versión 2'));
  sinRed = true; r = await pedir('/docs/calendario.pdf'); sinRed = false;
  ok('PDF: sin conexión se abre la última copia', r && (await texto(r)).includes('versión 2'));
  especiales.clear();

  /* ── recursos estáticos: copia al instante y se actualiza por detrás ── */
  r = await pedir('/icon-512.png', { destination: 'image' });
  ok('Íconos: se guardan al usarlos', r && r.ok && !!(await app.match(ORIGEN + '/icon-512.png')));
  especiales.set(ORIGEN + '/favicon.ico', () => new Resp('<html>Portal del wifi</html>', { ctype: TIPOS.html }));
  r = await pedir('/favicon.ico', { destination: 'image' });
  ok('Íconos: una página HTML en lugar del archivo (portal de wifi) no se guarda', !(await app.match(ORIGEN + '/favicon.ico')));
  especiales.set(ORIGEN + '/icono-que-no-esta.png', () => new Resp('', { status: 404, ctype: TIPOS.png }));
  r = await pedir('/icono-que-no-esta.png', { destination: 'image' });
  ok('Íconos: un error (404) no se guarda', r && r.status === 404 && !(await app.match(ORIGEN + '/icono-que-no-esta.png')));
  especiales.set(ORIGEN + '/docs/movido.pdf', () => new Resp('%PDF-1.7 otro archivo', { redirected: true, ctype: TIPOS.pdf }));
  r = await pedir('/docs/movido.pdf');
  ok('PDF: si la dirección redirige a otra parte, no se guarda', !(await app.match(ORIGEN + '/docs/movido.pdf')));
  especiales.clear();
  r = await pedir('https://cdn.jsdelivr.net/npm/algo.js', { destination: 'script' });
  ok('Otros sitios: una respuesta opaca no se guarda', !(await caches.match('https://cdn.jsdelivr.net/npm/algo.js')));

  console.log(R.join('\n'));
  console.log('\n' + R.filter(x => x.startsWith('✅')).length + '/' + R.length + ' bien');
})().catch(e => { console.log(R.join('\n')); console.log('ERR ' + (e && e.stack || e)); });
