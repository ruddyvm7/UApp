/* v2.8.2 · Panel de la directiva (panel-admin.html) con un Supabase de mentira: inicio de sesión, permisos, avisos,
   adjuntos (incluido el borrado de archivos que ya no usa ningún aviso), textos peligrosos y evaluaciones.
   Todos los datos son inventados. */
const fs = require('fs'), path = require('path'); const { JSDOM } = require('jsdom');
const R = []; const ok = (n, c) => R.push((c ? '✅' : '❌') + ' ' + n);
const pausa = ms => new Promise(r => setTimeout(r, ms || 20));
const RAIZ = path.join(__dirname, '..', '..');
const SB = 'https://pohrbljeamhfkcjxikct.supabase.co', PUB = SB + '/storage/v1/object/public/documentos/';

/* El panel es un módulo con «await» al final: jsdom no corre módulos, así que se envuelve en una función async */
let HTML = fs.readFileSync(process.argv[2] || path.join(RAIZ, 'panel-admin.html'), 'utf8')
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase[^>]*><\/script>/, '')
  .replace('<script type="module">', '<script>(async () => { "use strict";');
const fin = HTML.lastIndexOf('</script>');
HTML = HTML.slice(0, fin) + '})().catch(e => { window.__error = e; });' + HTML.slice(fin);

/* Supabase de mentira: tablas en memoria, depósito y registro de cada llamada */
function crearSupabase(sesion, base) {
  const db = JSON.parse(JSON.stringify(base)), deposito = new Set(base.deposito || []), llamadas = [], fallas = {};
  let sigId = 1000;
  function consulta(tabla) {
    let op = 'select', valores = null, filtros = [], orden = [], tope = null, uno = false, conflicto = null;
    const q = {
      select() { return q; }, insert(v) { op = 'insert'; valores = v; return q; }, update(v) { op = 'update'; valores = v; return q; },
      delete() { op = 'delete'; return q; }, upsert(v, o) { op = 'upsert'; valores = v; conflicto = o && o.onConflict; return q; },
      eq(c, v) { filtros.push(f => String(f[c]) === String(v)); return q; }, gte(c, v) { filtros.push(f => String(f[c]) >= String(v)); return q; },
      order(c) { orden.push(c); return q; }, limit(n) { tope = n; return q; }, maybeSingle() { uno = true; return q; },
      then(res, rej) { return Promise.resolve().then(ejecutar).then(res, rej); },
    };
    function ejecutar() {
      llamadas.push({ tabla, op, valores, conflicto });
      const f = fallas[tabla + '.' + op]; if (f) return { data: null, error: f };
      const filas = db[tabla] || (db[tabla] = []), pasa = x => filtros.every(g => g(x));
      if (op === 'insert') { [].concat(valores).forEach(v => filas.push(Object.assign({ id: sigId++, created_at: new Date().toISOString() }, v))); return { data: null, error: null }; }
      if (op === 'update') { filas.filter(pasa).forEach(x => Object.assign(x, valores)); return { data: null, error: null }; }
      if (op === 'delete') { db[tabla] = filas.filter(x => !pasa(x)); return { data: null, error: null }; }
      if (op === 'upsert') {
        const cols = conflicto.split(',');
        [].concat(valores).forEach(v => { const y = filas.find(x => cols.every(c => x[c] === v[c])); if (y) Object.assign(y, v); else filas.push(Object.assign({ id: sigId++ }, v)); });
        return { data: null, error: null };
      }
      let d = filas.filter(pasa); orden.forEach(c => d.sort((a, b) => String(a[c]).localeCompare(String(b[c]))));
      if (tope != null) d = d.slice(0, tope);
      return { data: uno ? (d[0] || null) : JSON.parse(JSON.stringify(d)), error: null };
    }
    return q;
  }
  const cliente = {
    auth: {
      getSession: async () => ({ data: { session: sesion } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => { llamadas.push({ op: 'signOut' }); return { error: null }; },
      signInWithOAuth: async o => { llamadas.push({ op: 'oauth', o }); return { error: null }; },
    },
    from: consulta,
    storage: {
      from: b => ({
        upload: async (ruta, archivo) => { llamadas.push({ op: 'upload', b, ruta }); if (fallas['storage.upload']) return { error: fallas['storage.upload'] }; deposito.add(ruta); return { error: null }; },
        remove: async rutas => { llamadas.push({ op: 'remove', b, rutas }); if (fallas['storage.remove']) return { data: null, error: fallas['storage.remove'] };
          /* como Supabase: devuelve los archivos que borró; sin políticas (o si ya no estaba) la lista viene vacía */
          if (fallas['storage.sinPoliticas']) return { data: [], error: null };
          const borrados = rutas.filter(r => deposito.has(r)); borrados.forEach(r => deposito.delete(r)); return { data: borrados.map(name => ({ name })), error: null }; },
        getPublicUrl: ruta => ({ data: { publicUrl: PUB + ruta.split('/').map(encodeURIComponent).join('/') } }),
      }),
    },
  };
  return { cliente, db: () => db, deposito, llamadas, fallas };
}

async function abrir(sesion, base) {
  const sb = crearSupabase(sesion, base);
  const dom = new JSDOM(HTML, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://miuapp.cl/panel-admin.html', beforeParse(w) {
    w.supabase = { createClient: () => sb.cliente };
    w.confirm = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
  } });
  await pausa(60);
  return { w: dom.window, d: dom.window.document, sb };
}
const T = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
const archivo = (name, size) => ({ target: { files: [{ name, size: size || 2048 }], value: 'C:\\fakepath\\' + name } });
const ruta = u => decodeURIComponent(u.slice(PUB.length));

const EDITORA = { user: { email: 'editora@prueba.cl' } };
const BASE = {
  editores: [{ email: 'editora@prueba.cl', rol: 'editor', nombre: 'Editora de Prueba' }],
  avisos: [
    { id: 1, titulo: 'Aviso con archivo propio', texto: 'Texto', publicado: true, jornada: 'tech', nivel: 'normal', doc_url: PUB + 'avisos/1-propio.pdf', doc_label: 'Ver', created_at: '2026-10-30' },
    { id: 2, titulo: 'Aviso A con archivo compartido', texto: 'Texto', publicado: true, jornada: 'tech', nivel: 'normal', doc_url: PUB + 'avisos/2-compartido.pdf', created_at: '2026-10-29' },
    { id: 3, titulo: 'Aviso B con archivo compartido', texto: 'Texto', publicado: false, jornada: 'tech', nivel: 'normal', doc_url: PUB + 'avisos/2-compartido.pdf', created_at: '2026-10-28' },
    { id: 4, titulo: 'Aviso con enlace externo', texto: 'Texto', publicado: true, jornada: 'tech', nivel: 'normal', doc_url: 'https://www.ejemplo.cl/calendario.pdf', created_at: '2026-10-27' },
    { id: 5, titulo: '<img src=x onerror="window.__xss=1">', texto: '<script>window.__xss=2<\/script>', publicado: true, jornada: 'tech', nivel: 'normal', doc_url: 'javascript:window.__xss=3', doc_label: 'Ver', created_at: '2026-10-26' },
  ],
  evaluaciones: [],
  deposito: ['avisos/1-propio.pdf', 'avisos/2-compartido.pdf', 'avisos/otro-que-no-se-toca.pdf'],
};

(async () => {
  /* ── sin permiso de editor ── */
  let p = await abrir({ user: { email: 'otra.persona@prueba.cl' } }, BASE);
  ok('Sin permiso de editor: el panel no se muestra', p.d.getElementById('panel').style.display !== 'block');
  ok('Sin permiso de editor: se explica y se cierra la sesión', /no tienes permisos/.test(T(p.d.getElementById('gateMsg'))) && p.sb.llamadas.some(x => x.op === 'signOut'));
  ok('Sin permiso de editor: no se leen avisos', !p.sb.llamadas.some(x => x.tabla === 'avisos'));
  p = await abrir(null, BASE);
  p.d.getElementById('btnLogin').click(); await pausa();
  const oa = p.sb.llamadas.find(x => x.op === 'oauth');
  ok('Sin sesión: se entra con la cuenta institucional (Microsoft) y se vuelve al panel', oa && oa.o.provider === 'azure' && oa.o.options.redirectTo === 'https://miuapp.cl/panel-admin.html');

  /* ── editora ── */
  p = await abrir(EDITORA, BASE);
  const { d, w, sb } = p;
  ok('Editora: entra al panel y ve su nombre', d.getElementById('panel').style.display === 'block' && /Editora de Prueba/.test(T(d.getElementById('userInfo'))));
  ok('Editora: ve todos los avisos, con borradores aparte', d.querySelectorAll('[data-card]').length === 5 && /Borradores/.test(T(d.getElementById('lista'))));
  ok('Textos peligrosos: un aviso con código no se ejecuta', w.__xss === undefined && !d.querySelector('#lista img') && !d.querySelector('#lista script'));
  ok('Textos peligrosos: un enlace «javascript:» no se convierte en enlace', ![...d.querySelectorAll('#lista a')].some(a => /^javascript:/i.test(a.getAttribute('href'))));
  ok('Textos peligrosos: los enlaces abren aparte sin dar acceso a esta página', [...d.querySelectorAll('#lista a')].every(a => a.target === '_blank' && /noopener/.test(a.rel)));

  /* nuevo aviso con archivo: el nombre se limpia y queda en el depósito */
  const $ = id => d.getElementById(id);
  await $('f_file').onchange(archivo('Calendario de Pruebas Ñuble.pdf'));
  const subido = sb.llamadas.filter(x => x.op === 'upload').pop();
  ok('Adjuntar: el nombre del archivo se limpia (sin tildes ni espacios)', subido && /^avisos\/\d+-calendario-de-pruebas-nuble\.pdf$/.test(subido.ruta));
  ok('Adjuntar: el archivo queda a la vista con su enlace', /Calendario de Pruebas Ñuble\.pdf/.test(T($('fileBox'))));
  /* cambiar de archivo antes de guardar: el primero ya no sirve y se borra */
  await $('f_file').onchange(archivo('Calendario corregido.pdf')); await pausa();
  const segundo = sb.llamadas.filter(x => x.op === 'upload').pop();
  ok('Adjuntar otro antes de guardar: el primero se borra del depósito', !sb.deposito.has(subido.ruta) && sb.deposito.has(segundo.ruta));
  $('f_titulo').value = 'Calendario de pruebas'; $('f_texto').value = 'Revisen las fechas.'; $('f_publicado').checked = true;
  await $('btnGuardar').onclick(); await pausa();
  const nuevo = sb.db().avisos.find(a => a.titulo === 'Calendario de pruebas');
  ok('Guardar: el aviso queda con el archivo nuevo y publicado', nuevo && ruta(nuevo.doc_url) === segundo.ruta && nuevo.publicado === true && nuevo.autor === 'Editora de Prueba');
  ok('Guardar: el archivo del aviso sigue en el depósito', sb.deposito.has(segundo.ruta));

  /* subir y quitar sin guardar */
  await $('f_file').onchange(archivo('borrador.pdf'));
  const tercero = sb.llamadas.filter(x => x.op === 'upload').pop();
  $('btnQuitarDoc').click(); await pausa();
  ok('Quitar un archivo recién subido y sin guardar lo borra del depósito', !sb.deposito.has(tercero.ruta));
  await $('f_file').onchange(archivo('otro-borrador.pdf'));
  const cuarto = sb.llamadas.filter(x => x.op === 'upload').pop();
  $('btnCancelar').onclick(); await pausa();
  ok('Cancelar con un archivo recién subido lo borra del depósito', !sb.deposito.has(cuarto.ruta));
  const antes = sb.llamadas.filter(x => x.op === 'upload').length;
  await $('f_file').onchange(archivo('enorme.pdf', 25 * 1048576));
  ok('Un archivo de más de 20 MB se rechaza antes de subirlo', sb.llamadas.filter(x => x.op === 'upload').length === antes && /máximo son 20 MB/.test(T($('formMsg'))));

  /* editar un aviso y cambiarle el archivo: el anterior se borra si nadie más lo usa */
  const editarBtn = id => d.querySelector('[data-edit="' + id + '"]');
  editarBtn(1).click(); await pausa();
  ok('Editar: el formulario se llena con el aviso', $('f_titulo').value === 'Aviso con archivo propio' && /1-propio\.pdf/.test(T($('fileBox'))));
  await $('f_file').onchange(archivo('reemplazo.pdf'));
  const reemplazo = sb.llamadas.filter(x => x.op === 'upload').pop();
  ok('Editar: mientras no se guarda, el archivo anterior sigue en el depósito', sb.deposito.has('avisos/1-propio.pdf'));
  await $('btnGuardar').onclick(); await pausa(60);
  ok('Editar y cambiar el archivo: el anterior se borra del depósito', !sb.deposito.has('avisos/1-propio.pdf') && sb.deposito.has(reemplazo.ruta));
  ok('Editar y cambiar el archivo: el aviso queda con el nuevo', ruta(sb.db().avisos.find(a => a.id === 1).doc_url) === reemplazo.ruta);

  /* editar uno de dos avisos que comparten archivo y quitárselo: el archivo sigue (el otro aviso lo usa) */
  editarBtn(2).click(); await pausa();
  $('btnQuitarDoc').click(); await $('btnGuardar').onclick(); await pausa(60);
  ok('Un archivo que otro aviso sigue usando no se borra', sb.deposito.has('avisos/2-compartido.pdf') && sb.db().avisos.find(a => a.id === 2).doc_url === null);

  /* eliminar avisos */
  const eliminar = async id => { d.querySelector('[data-del="' + id + '"]').click(); await pausa(80); };
  await eliminar(3);
  ok('Eliminar el último aviso que usa un archivo lo borra del depósito', !sb.db().avisos.some(a => a.id === 3) && !sb.deposito.has('avisos/2-compartido.pdf'));
  const removes = sb.llamadas.filter(x => x.op === 'remove').length;
  await eliminar(4);
  ok('Eliminar un aviso con enlace externo no toca el depósito', !sb.db().avisos.some(a => a.id === 4) && sb.llamadas.filter(x => x.op === 'remove').length === removes);
  ok('El depósito conserva los archivos que no son de estos avisos', sb.deposito.has('avisos/otro-que-no-se-toca.pdf'));

  /* sin las políticas de seguridad-v282.sql: el aviso se borra igual y se avisa */
  sb.fallas['storage.remove'] = { message: 'new row violates row-level security policy' };
  const idNuevo = sb.db().avisos.find(a => a.titulo === 'Calendario de pruebas').id;
  await eliminar(idNuevo);
  ok('Si el depósito no deja borrar, el aviso se elimina igual y se explica qué revisar',
    !sb.db().avisos.some(a => a.id === idNuevo) && /seguridad-v282\.sql/.test(T($('listMsg'))));
  delete sb.fallas['storage.remove'];
  /* sin las políticas de borrado, Supabase no da error: dice que no borró nada. También se avisa */
  sb.fallas['storage.sinPoliticas'] = true;
  editarBtn(2).click(); await pausa();
  await $('f_file').onchange(archivo('otro-mas.pdf')); await pausa();
  const otroMas = sb.llamadas.filter(x => x.op === 'upload').pop();
  $('btnCancelar').onclick(); await pausa(60);
  ok('Si el depósito responde que no borró nada (faltan las políticas), también se avisa', sb.deposito.has(otroMas.ruta) && /seguridad-v282\.sql/.test(T($('listMsg'))));
  delete sb.fallas['storage.sinPoliticas'];

  /* publicar y despublicar */
  d.querySelector('[data-toggle="2"]').click(); await pausa(60);
  ok('Despublicar un aviso', sb.db().avisos.find(a => a.id === 2).publicado === false);

  /* ── evaluaciones (tabla inventada, como se copia desde Excel) ── */
  $('ev_pegar').value = ['Fecha\tJornada\tAsignatura\tDocente\tHora y modalidad\tSala',
    '20-11\tTECH\tDERECHO DE PRUEBA I S1\tDocente Uno\t19:00 presencial\t201',
    '27-11\tTECH\tRAMO INVENTADO II\tDocente Dos\t18:30 online\t',
    '27-11\tTECH\tRAMO INVENTADO II\tDocente Dos\t18:30 online\t'].join('\n');
  $('btnOrdenar').onclick(); await pausa();
  ok('Evaluaciones: «Ordenar» arma el texto del aviso', /Derecho de Prueba I/.test($('f_texto').value) && /Ramo Inventado II/.test($('f_texto').value));
  await $('btnPublicarEv').onclick(); await pausa(60);
  const up = sb.llamadas.filter(x => x.tabla === 'evaluaciones' && x.op === 'upsert').pop();
  ok('Evaluaciones: se publican sin repetir filas y sin pisar otras (upsert por jornada, fecha, ramo y sección)',
    up && up.conflicto === 'jornada,fecha,asignatura,seccion' && up.valores.length === 2 && sb.db().evaluaciones.length === 2);
  ok('Evaluaciones: cada fila queda con su fecha, jornada y sección', up && up.valores.every(f => /^\d{4}-\d{2}-\d{2}$/.test(f.fecha) && f.jornada === 'tech'));

  ok('El panel no tuvo errores', !w.__error);
  console.log(R.join('\n'));
  console.log('\n' + R.filter(x => x.startsWith('✅')).length + '/' + R.length + ' bien');
  process.exit(0);
})().catch(e => { console.log(R.join('\n')); console.log('ERR ' + (e && e.stack || e)); process.exit(0); });
