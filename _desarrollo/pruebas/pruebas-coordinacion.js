/* v2.8.2 · Página de la coordinación (carga-2026/index.html): «Apoyo a la Toma de Carga».
   Se pega un Reporte de Avance Curricular inventado (estudiante y notas ficticios) y se revisa lo que la página
   concluye, contra las reglas de la Circular 05/2026 escritas aparte en esta prueba: rango de niveles,
   prerrequisitos, reprobadas obligatorias y tercera oportunidad. También que nada salga del navegador. */
const fs = require('fs'), path = require('path'); const { JSDOM } = require('jsdom');
const R = []; const ok = (n, c) => R.push((c ? '✅' : '❌') + ' ' + n);
const RAIZ = path.join(__dirname, '..', '..');
/* la página carga la malla y los horarios desde ../datos/tech.js (el mismo archivo de la app): aquí se mete adentro */
const HTML = fs.readFileSync(process.argv[2] || path.join(RAIZ, 'carga-2026', 'index.html'), 'utf8')
  .replace(/<script src="\.\.\/(datos\/[a-z0-9-]+\.js)\?v=[0-9a-f]+"><\/script>/g, (m, r) => '<script>' + fs.readFileSync(path.join(RAIZ, r), 'utf8') + '</script>');

function abrir() {
  const fuera = [];
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://miuapp.cl/carga-2026/', beforeParse(w) {
    w.fetch = (...a) => { fuera.push(['fetch', String(a[0])]); return Promise.reject(new Error('sin red')); };
    const abrirXHR = w.XMLHttpRequest.prototype.open; w.XMLHttpRequest.prototype.open = function (m, u) { fuera.push(['xhr', String(u)]); return abrirXHR.apply(this, arguments); };
    w.navigator.sendBeacon = u => { fuera.push(['beacon', String(u)]); return true; };
    w.HTMLElement.prototype.scrollIntoView = function () {};
  } });
  return { w: dom.window, d: dom.window.document, fuera };
}
const T = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

/* Reporte inventado, con la forma del PDF copiado: «nivel CÓDIGO-Nombre P:período Nrc:n- CÓDIGO Nota: x,x» */
function reporte(nombre, ramos) {
  return 'Universidad Autónoma de Chile\nREPORTE DE AVANCE CURRICULAR\nID: 99887766\nNombre: ' + nombre +
    '\nPrograma: Derecho Vespertino TECH (prueba)\n' +
    ramos.map(([nivel, cod, nom, notas], i) => nivel + ' ' + cod + '-' + nom + ' ' +
      notas.map((n, j) => 'P:2025' + String(10 + j * 10).padStart(2, '0') + ' Nrc:' + (5000 + i * 3 + j) + '- ' + cod + ' Nota: ' + n.toFixed(1).replace('.', ','))
        .join(' ')).join('\n');
}

(async () => {
  const { w, d, fuera } = abrir();
  const C = w.eval('COURSES'), MAPA = w.eval('MAPA');
  const codigo = {}; Object.keys(MAPA).forEach(k => { codigo[MAPA[k]] = k; });
  const nivel = id => C.find(c => c.id === id).t;
  /* aprobó todo el primer año y parte del segundo; Organización de Tribunales (14) reprobada dos veces
     (va por la tercera) y Teoría del Proceso (17) reprobada una */
  const aprobadas = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16];
  const ramos = aprobadas.map(id => [nivel(id) * 10, codigo[id], 'Ramo ' + id, [5.5]])
    .concat([[40, codigo[14], 'Ramo 14', [3.2, 3.8]], [50, codigo[17], 'Ramo 17', [3.5]]]);
  d.getElementById('txt').value = reporte('ESTUDIANTE DE PRUEBA', ramos);
  d.getElementById('go').click();
  const sal = d.getElementById('salida'), ficha = {};
  sal.querySelectorAll('.ficha > div').forEach(x => { ficha[T(x.querySelector('dt'))] = x.querySelector('dd'); });
  ok('Lee el nombre y el ID del reporte', /ESTUDIANTE DE PRUEBA/.test(T(ficha.Estudiante)) && /99887766/.test(T(ficha.Estudiante)));
  ok('Cuenta 15 aprobadas', T(ficha.Aprobadas) === '15');
  ok('Cuenta 2 reprobadas y avisa que una va por tercera vez', /^2/.test(T(ficha.Reprobadas)) && /1 va por 3ª vez/.test(T(ficha.Reprobadas)));
  ok('Cuenta el resto como pendientes', T(ficha.Pendientes).startsWith(String(C.length - 17)));
  ok('Nivel que cursa: 5 (aprobó la mitad o más del nivel 4); el más bajo pendiente es el 4', /^5/.test(T(ficha['Nivel que cursa'])) && /más bajo pendiente: 4/.test(T(ficha['Nivel que cursa'])));
  ok('Rango permitido: niveles 4 a 5 (desde el más bajo pendiente, sin adelantar)', /niveles 4 a 5/.test(T(sal)));

  /* cada fila «Puede inscribir» cumple las reglas, revisadas aquí sin usar el código de la página */
  const S = new Set(aprobadas), reprob = new Set([14, 17]);
  /* {upTo:id} = todos los ramos hasta el nivel de ese ramo, menos el propio (la misma regla de la malla de la app) */
  const pre = c => (Array.isArray(c.p) ? c.p.every(id => S.has(id)) : C.filter(x => x.t <= nivel(c.p.upTo) && x.id !== c.id).every(x => S.has(x.id)));
  let filas = 0, bien = true;
  sal.querySelectorAll('table tbody tr').forEach(tr => {
    const td = tr.querySelectorAll('td'); if (td.length < 6) return;
    const c = C.find(x => x.n === T(td[0].querySelector('b'))); if (!c) return;
    filas++;
    const puede = /Puede inscribir/.test(T(td[5]));
    const debe = !S.has(c.id) && c.t >= 4 && c.t <= 5 && pre(c);
    if (puede !== debe || S.has(c.id)) bien = false;
  });
  ok('Cada asignatura ofrecida se marca «puede» o «no» según nivel y prerrequisitos (' + filas + ' revisadas)', filas > 0 && bien);
  const obligatorias = [...sal.querySelectorAll('.nota')].find(n => /Debe inscribir obligatoriamente/.test(T(n)));
  const ofrecidas = new Set(Object.keys(w.eval('ofertaDelPeriodo()')).map(Number));
  const esperadas = [...reprob].filter(id => ofrecidas.has(id)).map(id => C.find(c => c.id === id).n);
  ok('Las reprobadas que se ofrecen este período quedan como obligatorias', esperadas.length
    ? !!obligatorias && esperadas.every(n => T(obligatorias).includes(n)) : !obligatorias);
  const tercera = [...sal.querySelectorAll('.nota')].find(n => /Tercera oportunidad/.test(T(n)));
  ok('La que va por tercera oportunidad se avisa sin coincidencias de horario (si se ofrece)', ofrecidas.has(14) ? !!tercera && T(tercera).includes(C.find(c => c.id === 14).n) : !tercera);
  ok('La malla marca aprobadas, reprobadas y la tercera oportunidad', sal.querySelectorAll('.malla .cel.ok').length === 15 && sal.querySelectorAll('.malla .cel.no').length === 2 && sal.querySelectorAll('.malla .cel.tercera').length === 1);

  /* otra estudiante: avanzó hasta el nivel 6 completo y aprobó un ramo del 7, pero le quedó pendiente un electivo
     del nivel 1. Cursa el nivel 7, pero el rango llega solo hasta el 4: tres niveles sobre el más bajo pendiente */
  const otra = C.filter(c => c.t <= 6 && c.id !== 4).map(c => c.id).concat([26]);
  d.getElementById('txt').value = reporte('OTRA ESTUDIANTE DE PRUEBA', otra.map(id => [nivel(id) * 10, codigo[id], 'Ramo ' + id, [6.0]]));
  d.getElementById('go').click();
  const f2 = {}; sal.querySelectorAll('.ficha > div').forEach(x => { f2[T(x.querySelector('dt'))] = x.querySelector('dd'); });
  ok('Nivel que cursa: 7 (un solo ramo aprobado del 7 no basta para pasar al 8)', /^7/.test(T(f2['Nivel que cursa'])) && /más bajo pendiente: 1/.test(T(f2['Nivel que cursa'])));
  ok('Rango permitido: del más bajo pendiente hasta tres niveles más (1 a 4), aunque curse el 7', /niveles 1 a 4/.test(T(sal)));

  /* las reglas por separado (no dependen de la oferta del período) */
  const ap = ids => { const o = {}; ids.forEach(id => { o[id] = { estado: 'aprobado' }; }); return o; };
  const pr = (id, ids) => w.eval('prereqOK')(C.find(c => c.id === id), ap(ids));
  ok('Prerrequisitos: Taller de Integración I pide Acto Jurídico y Organización de Tribunales', !pr(24, [14]) && !pr(24, [13]) && pr(24, [13, 14]));
  const hasta = id => C.filter(c => c.t <= nivel(id)).map(c => c.id);
  ok('Prerrequisitos: el Seminario y la Clínica piden aprobado todo hasta el nivel 9', pr(51, hasta(35)) && !pr(51, hasta(35).slice(1)) && pr(55, hasta(35)));
  ok('Prerrequisitos: el Taller de Integración III pide aprobado todo hasta el nivel 13', pr(54, hasta(53)) && !pr(54, hasta(52).filter(id => id !== 49)));
  /* quinto año: aprobó todo hasta el nivel 13. El Taller de Integración III (nivel 14) se puede inscribir si se ofrece */
  const quinto = C.filter(c => c.t <= 13).map(c => c.id);
  d.getElementById('txt').value = reporte('ESTUDIANTE DE QUINTO', quinto.map(id => [nivel(id) * 10, codigo[id], 'Ramo ' + id, [5.0]]));
  d.getElementById('go').click();
  const filaTI3 = [...sal.querySelectorAll('table tbody tr')].find(tr => /Taller de Integración III/.test(T(tr.querySelector('td'))));
  ok('Quinto año: el Taller de Integración III aparece como inscribible (si está en la oferta)', ofrecidas.has(54) ? !!filaTI3 && /Puede inscribir/.test(T(filaTI3)) : !filaTI3);
  const ni = w.eval('nivelesInfo')(ap(otra));
  ok('Niveles: más bajo pendiente 1, cursa el 7, tope 4', ni.ancla === 1 && ni.avance === 7 && ni.techo === 4);

  /* privacidad: nada sale del navegador ni queda guardado */
  ok('Ningún dato del reporte sale del navegador (sin pedidos a internet)', fuera.length === 0);
  let guardado = 0; try { guardado = w.localStorage.length + w.sessionStorage.length; } catch (e) {}
  ok('Nada del reporte queda guardado en el navegador', guardado === 0);

  /* textos peligrosos en el reporte */
  d.getElementById('txt').value = reporte('<img src=x onerror="window.__xss=1">', ramos.slice(0, 3));
  d.getElementById('go').click();
  ok('Un nombre con código en el reporte se muestra como texto y no se ejecuta', !sal.querySelector('img') && w.__xss === undefined && /<img/.test(T(sal)));

  /* reportes que no sirven */
  d.getElementById('txt').value = 'Hola, esto no es un reporte';
  d.getElementById('go').click();
  ok('Un texto que no es un reporte se explica sin romper la página', /No pude leer el reporte/.test(T(sal)));
  d.getElementById('txt').value = '';
  d.getElementById('go').click();
  ok('Sin texto pide pegar el reporte', /Pega primero el reporte/.test(T(sal)));
  d.getElementById('txt').value = reporte('ESTUDIANTE DE PRUEBA', ramos);
  d.getElementById('go').click(); d.getElementById('limpiar').click();
  ok('«Limpiar» borra el reporte y el resultado (no solo lo oculta)', d.getElementById('txt').value === '' && sal.classList.contains('oculto') && sal.innerHTML === '' && T(d.getElementById('sello')) === '');

  /* una sola copia de la malla y los horarios (datos/tech.js), y la app usa la misma regla de prerrequisitos */
  const copia = /const (COURSES|COURSES_NA|CR_AJUSTADA|CR_NOAJUST|HOR_TECH)=/;
  ok('Ni la app ni la coordinación tienen copias propias de la malla, los créditos o los horarios',
    !copia.test(fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8')) && !copia.test(fs.readFileSync(path.join(RAIZ, 'carga-2026', 'index.html'), 'utf8')));
  if (!fs.existsSync(path.join(__dirname, 'trabajo.html'))) require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'armar-prueba.js')]);
  const app = new JSDOM(fs.readFileSync(path.join(__dirname, 'trabajo.html'), 'utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/, ''),
    { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://miuapp.cl/?derechotech', beforeParse(x) { x.scrollTo = () => {}; x.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }); } }).window;
  await new Promise(r => setTimeout(r, 300));
  const regla = w.eval('prerrequisitosDe');
  ok('La malla de la app y la coordinación calculan igual los prerrequisitos de los ' + C.length + ' ramos',
    C.every(c => JSON.stringify(app.eval('prereqIds')(app.eval('byId')[c.id])) === JSON.stringify(regla(c, C))));
  app.close();

  console.log(R.join('\n'));
  console.log('\n' + R.filter(x => x.startsWith('✅')).length + '/' + R.length + ' bien');
})().catch(e => { console.log(R.join('\n')); console.log('ERR ' + (e && e.stack || e)); });
