const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const precargar=async w=>{ if(w.__estudio&&w.__estudio.cargar) await Promise.all(Object.keys(w.__estudio.indice).map(k=>w.__estudio.cargar(k))); };   /* v2.6.1: el contenido de los mazos se descarga aparte */
const html=fs.readFileSync(process.argv[2]||'trabajo.html','utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,'<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>');
function abrir(fecha,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const vis=el=>el&&el.style.display!=='none';
const clic=(doc,sel)=>{const b=doc.querySelector(sel); if(b) b.click(); return !!b;};
(async()=>{try{
  let d=abrir([2026,9,13,10,0]), w=d.window, doc=w.document; await sleep(1100); await precargar(w);
  const M=w.__estudio.mazos['acto-juridico'];
  /* ═══ contenido ═══ */
  const idsT=new Set(M.tarjetas.map(t=>t.id)), idsP=new Set(M.preguntas.map(p=>p.id));
  ok('Contenido: '+M.tarjetas.length+' tarjetas y '+M.preguntas.length+' preguntas, sin ids repetidos', M.tarjetas.length>=30 && M.preguntas.length>=12 && idsT.size===M.tarjetas.length && idsP.size===M.preguntas.length);
  ok('  cada tarjeta con término, definición y fuente', M.tarjetas.every(t=>t.t&&t.d&&t.d.length>20&&t.r));
  ok('  cada pregunta con 4 alternativas, una correcta válida, explicación y fuente', M.preguntas.every(p=>p.o.length===4&&p.ok>=0&&p.ok<4&&p.por.length>20&&p.r&&new Set(p.o).size===4));
  /* ═══ navegación ═══ */
  ok('Inicio invita a probar Estudiar', /Nuevo: Estudiar/.test(T(doc.getElementById('repasoBox'))));
  clic(doc,'.tab[data-tab="pru"]'); await sleep(150);
  const segs=[...doc.querySelectorAll('#pru .seg2-b')].map(T).join('|');
  ok('Notas tiene tres opciones: '+segs, segs==='Fechas|Calculadora|Estudiar');
  clic(doc,'#pru [data-ir="estudio"]'); await sleep(200);
  ok('  «Estudiar» abre su sección y Notas sigue marcada', vis(doc.getElementById('estudio')) && doc.querySelector('.tabbar .tab.active').dataset.tab==='pru');
  const tiles=[...doc.querySelectorAll('#estudioApp .es-lin')], nombres=tiles.map(b=>T(b.querySelector('b')));
  ok('Estudiar parte con un botón por línea: '+nombres.join(', '), nombres.join('|')==='Civil|Procesal|Constitucional|Penal|Comercial|Laboral|Administrativo|Económico y tributario|Historia y fundamentos' && !doc.querySelector('#estudioApp .es-ramo'));
  ok('  Civil (9 ramos) y Procesal (8) tienen material; las demás dicen «Próximamente»', /^9 ramos · 1\.289 tarjetas$/.test(T(tiles[0].querySelector('small'))) && /^8 ramos/.test(T(tiles[1].querySelector('small'))) && !tiles[0].classList.contains('pronto') && !tiles[1].classList.contains('pronto') && tiles.slice(2).every(b=>b.classList.contains('pronto')&&/Próximamente/.test(T(b))));
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(100);
  const civ=doc.querySelector('#estudioApp .es-lista'), ramosCiv=[...civ.querySelectorAll('button.es-ramo b')].map(T);
  ok('  la línea civil abre con sus 9 ramos en orden de malla, todos disponibles', T(doc.querySelector('#estudioApp h1'))==='Línea civil' && civ.children.length===9 && ramosCiv.length===9 && !civ.querySelector('.pronto') && /Nivel 2 ·/.test(T(civ.querySelector('small'))));
  ok('  entre ellos Teoría (627 tarjetas) y Fuentes de las Obligaciones (536)', ramosCiv.indexOf('Teoría de las Obligaciones')===4 && ramosCiv.indexOf('Fuentes de las Obligaciones')===5 && /627 tarjetas y 171 preguntas/.test(T(civ.children[4])) && /536 tarjetas y 130 preguntas/.test(T(civ.children[5])));
  clic(doc,'[data-es="lineas"]'); await sleep(60); clic(doc,'[data-es="linea"][data-v="penal"]'); await sleep(60);
  ok('  una línea sin material muestra sus ramos como «Próximamente»', T(doc.querySelector('#estudioApp h1'))==='Línea penal' && doc.querySelectorAll('#estudioApp .es-ramo.pronto').length===4 && !doc.querySelector('#estudioApp button.es-ramo'));
  clic(doc,'[data-es="lineas"]'); await sleep(60); clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(60);
  clic(doc,'[data-es="abrir"][data-v="acto-juridico"]'); await sleep(150);
  ok('  el ramo vuelve a su línea con «‹ Línea civil»', T(doc.querySelector('#estudioApp .es-volver'))==='‹ Línea civil');
  ok('El ramo ofrece Tarjetas y Selección múltiple, con 20 nuevas por día por defecto', /Tarjetas/.test(T(doc.getElementById('estudioApp'))) && /Selección múltiple/.test(T(doc.getElementById('estudioApp'))) && /Para hoy: 20 tarjetas/.test(T(doc.getElementById('estudioApp'))));
  const opc=[...doc.querySelectorAll('#estudioApp .es-opc-b')];
  ok('  el selector ofrece 10, 20, 30 y Todas, con 20 marcado', opc.map(T).join('|')==='10|20|30|Todas' && opc[1].getAttribute('aria-checked')==='true');
  opc[0].click(); await sleep(60);
  ok('  al elegir 10: «Para hoy: 10» y queda guardado', /Para hoy: 10 tarjetas/.test(T(doc.getElementById('estudioApp'))) && JSON.parse(w.localStorage.getItem('uapp_estudio_v1')).cfg.nuevas===10);
  /* ═══ tarjetas ═══ */
  clic(doc,'[data-es="tarjetas"]'); await sleep(150);
  const app=()=>doc.getElementById('estudioApp');
  ok('Tarjetas: muestra el término y oculta la definición', !!app().querySelector('.es-termino') && !app().querySelector('.es-carta.vista') && !app().querySelector('.es-luz'));
  const primera=T(app().querySelector('.es-termino'));
  clic(doc,'.es-btn[data-es="voltear"]'); await sleep(80);
  ok('  «Ver definición» la muestra con su fuente y el semáforo', !!app().querySelector('.es-carta.vista') && app().querySelectorAll('.es-luz').length===3 && /Art\.|Doctrina/.test(T(app().querySelector('.es-dorso .es-ref'))));
  clic(doc,'.es-luz.v'); await sleep(60);
  const E1=w.__estudio.estado(), id1=M.tarjetas.find(t=>t.t===primera).id;
  ok('  verde: la tarjeta vuelve en 3 días', E1.c['acto-juridico/'+id1].due==='2026-10-16' && E1.c['acto-juridico/'+id1].u==='v');
  const segunda=T(app().querySelector('.es-termino')); clic(doc,'.es-btn[data-es="voltear"]'); await sleep(40); clic(doc,'.es-luz.a'); await sleep(40);
  const id2=M.tarjetas.find(t=>t.t===segunda).id;
  ok('  amarillo: vuelve mañana', w.__estudio.estado().c['acto-juridico/'+id2].due==='2026-10-14');
  const tercera=T(app().querySelector('.es-termino')); clic(doc,'.es-btn[data-es="voltear"]'); await sleep(40); clic(doc,'.es-luz.r'); await sleep(40);
  const id3=M.tarjetas.find(t=>t.t===tercera).id;
  ok('  rojo: vuelve mañana y en esta misma sesión', w.__estudio.estado().c['acto-juridico/'+id3].due==='2026-10-14' && /de 11$/.test(T(app().querySelector('.es-prog'))));
  let vuelta=false;
  for(let k=0;k<12;k++){ const t=app().querySelector('.es-termino'); if(!t) break; if(T(t)===tercera) vuelta=true; clic(doc,'.es-btn[data-es="voltear"]'); await sleep(20); clic(doc,'.es-luz.v'); await sleep(20); }
  ok('  la tarjeta en rojo reapareció antes del final', vuelta);
  ok('  al terminar: resumen por color y aviso para mañana', /Sesión lista/.test(T(app())) && /La domino: 9/.test(T(app())) && /Con dudas: 1/.test(T(app())) && /No la domino: 1/.test(T(app())));
  const guardado=w.localStorage.getItem('uapp_estudio_v1');
  ok('  el progreso queda guardado en el teléfono', !!guardado && Object.keys(JSON.parse(guardado).c).length===10);
  ok('  al terminar ofrece «Estudiar 10 nuevas más»', /Estudiar 10 nuevas más/.test(T(app())));
  clic(doc,'.es-botones [data-v="mas"]'); await sleep(60);
  const nuevaMas=M.tarjetas.find(x=>x.t===T(app().querySelector('.es-termino')));
  ok('  y abre otra sesión de 10 tarjetas que aún no habías visto', /1 de 10$/.test(T(app().querySelector('.es-prog'))) && !w.__estudio.estado().c['acto-juridico/'+nuevaMas.id]);
  clic(doc,'.es-prog [data-es="salir"]'); await sleep(40);
  /* ═══ selección múltiple ═══ */
  clic(doc,'[data-es="salir"]'); await sleep(40); clic(doc,'[data-es="preguntas"]'); await sleep(80);
  ok('Selección múltiple: 10 preguntas por ronda con 4 alternativas', /Pregunta 1 de 10/.test(T(app())) && app().querySelectorAll('.es-op').length===4);
  let malas=0;
  for(let k=0;k<10;k++){
    const q=T(app().querySelector('.es-preg')), P=M.preguntas.find(x=>x.q===q), ops=[...app().querySelectorAll('.es-op')];
    const elegir = k<3 ? ops.find(b=>T(b.querySelector('span'))!==P.o[P.ok]) : ops.find(b=>T(b.querySelector('span'))===P.o[P.ok]);
    elegir.click(); await sleep(30);
    if(k===0){ ok('  al fallar: la elegida en rojo, la correcta en verde y el porqué', !!app().querySelector('.es-op.mal') && !!app().querySelector('.es-op.ok') && /La correcta era la/.test(T(app().querySelector('.es-por'))) && /Art\./.test(T(app().querySelector('.es-por')))); }
    if(k<3) malas++;
    clic(doc,'.es-btn[data-es="sig"]'); await sleep(30);
  }
  ok('  resultado 7 de 10 y las 3 falladas para repasar', /7 de 10/.test(T(app())) && app().querySelectorAll('.es-malas div').length===3);
  clic(doc,'.es-botones [data-es="salir"]'); await sleep(40);
  ok('Estadísticas: 10 en repaso, 20 nuevas, racha de 1 día y mejor ronda 7 de 10', /En repaso: 10/.test(T(app())) && /Nuevas: 20/.test(T(app())) && /Racha de 1 día/.test(T(app())) && /mejor: 7 de 10/.test(T(app())));
  clic(doc,'[data-es="ramos"]'); await sleep(60);
  ok('«‹ Línea civil» vuelve a la lista: Acto Jurídico ya cumplió su cupo de hoy', T(app().querySelector('h1'))==='Línea civil' && /Al día/.test(T(app().querySelector('[data-v="acto-juridico"]'))) && /0 dominadas/.test(T(app().querySelector('[data-v="acto-juridico"]'))));
  clic(doc,'#estudio [data-ir="estudio"]'); await sleep(60);
  ok('  y tocar «Estudiar» estando ahí vuelve a las líneas: la civil «Al día», la procesal sin empezar', !!app().querySelector('.es-lineas') && /Al día/.test(T(app().querySelector('[data-es="linea"][data-v="civil"]'))) && !/Al día|Para hoy/.test(T(app().querySelector('[data-es="linea"][data-v="procesal"]'))));
  /* ═══ al día siguiente ═══ */
  const ls={'uapp_estudio_v1':w.localStorage.getItem('uapp_estudio_v1')};
  d=abrir([2026,9,14,9,0],ls); w=d.window; doc=w.document; await sleep(1100); await precargar(w);
  ok('Al día siguiente, Inicio avisa el repaso de hoy (amarilla y roja)', /Repaso de hoy/.test(T(doc.getElementById('repasoBox'))) && /2 tarjetas de Acto Jurídico/.test(T(doc.getElementById('repasoBox'))));
  clic(doc,'#repasoBox .es-repaso'); await sleep(150);
  ok('  tocarlo abre directo la sesión de tarjetas', vis(doc.getElementById('estudio')) && !!doc.querySelector('#estudioApp .es-termino') && /de 12$/.test(T(doc.querySelector('#estudioApp .es-prog'))));
  clic(doc,'.es-prog [data-es="salir"]'); await sleep(60);
  ok('  al salir queda en el ramo, que vuelve a la línea civil', T(doc.querySelector('#estudioApp h1'))==='Acto Jurídico' && T(doc.querySelector('#estudioApp .es-volver'))==='‹ Línea civil');
  clic(doc,'[data-es="ramos"]'); await sleep(60); clic(doc,'[data-es="lineas"]'); await sleep(60);
  ok('  la portada de Estudiar también ofrece el repaso de hoy, y la línea civil suma 12 para hoy', /Repaso de hoy 2 tarjetas de Acto Jurídico/.test(T(doc.querySelector('#estudioApp .es-hoy'))) && /Para hoy: 12/.test(T(doc.querySelector('#estudioApp [data-es="linea"][data-v="civil"]'))));
  clic(doc,'#estudioApp .es-hoy'); await sleep(80);
  ok('  y desde ahí abre directo la sesión', /de 12$/.test(T(doc.querySelector('#estudioApp .es-prog'))));
  /* ═══ el intervalo crece con cada verde ═══ */
  d=abrir([2026,9,16,9,0],ls); w=d.window; doc=w.document; await sleep(1100); await precargar(w);
  ok('  la verde de hace 3 días ya está para repasar', w.__estudio.resumen('acto-juridico').vencidas>=1);
  clic(doc,'.tab[data-tab="pru"]'); await sleep(60); clic(doc,'#pru [data-ir="estudio"]'); await sleep(80); clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(60); clic(doc,'[data-es="abrir"][data-v="acto-juridico"]'); await sleep(60); clic(doc,'[data-es="tarjetas"]'); await sleep(60);
  for(let k=0;k<20;k++){ const t=doc.querySelector('#estudioApp .es-termino'); if(!t) break; const id=M.tarjetas.find(x=>x.t===T(t)).id; clic(doc,'.es-btn[data-es="voltear"]'); await sleep(15); clic(doc,'.es-luz.v'); await sleep(15); if(id===id1) break; }
  const s1=w.__estudio.estado().c['acto-juridico/'+id1];
  ok('  segundo verde: el intervalo pasa de 3 a '+s1.iv+' días', s1.iv>=7 && s1.due>'2026-10-22');
  /* ═══ nombres del semáforo ═══ */
  d=abrir([2026,9,20,9,0],ls); w=d.window; doc=w.document; await sleep(1100); await precargar(w);
  clic(doc,'.tab[data-tab="pru"]'); await sleep(60); clic(doc,'#pru [data-ir="estudio"]'); await sleep(80); clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(60); clic(doc,'[data-es="abrir"][data-v="acto-juridico"]'); await sleep(60); clic(doc,'[data-es="tarjetas"]'); await sleep(60);
  clic(doc,'.es-btn[data-es="voltear"]'); await sleep(40);
  const luces=[...doc.querySelectorAll('#estudioApp .es-luz')].map(b=>T(b));
  ok('El semáforo dice: '+luces.join(' · '), luces.join('|')==='No la domino Se repite hoy|Con dudas Se repite mañana|La domino Repaso espaciado');
  [...doc.querySelectorAll('.es-luz')].length; clic(doc,'.es-prog [data-es="salir"]'); await sleep(40);
  const todas=[...doc.querySelectorAll('#estudioApp .es-opc-b')].find(b=>T(b)==='Todas'); todas.click(); await sleep(50);
  const rT=w.__estudio.resumen('acto-juridico');
  ok('«Todas»: el repaso de hoy incluye todas las tarjetas que faltan por ver ('+rT.nuevasHoy+')', rT.nuevas>10 && rT.nuevasHoy===rT.nuevas && /Para hoy: \d+ tarjetas/.test(T(doc.getElementById('estudioApp'))));
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
