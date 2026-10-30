/* v2.6.1 · Estudiar en archivos aparte: índice liviano, descarga al abrir un ramo, sin conexión,
   y que todas las pantallas se vean exactamente igual que antes del cambio */
const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const STUB_SB='<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>';
const prep=f=>fs.readFileSync(f,'utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,STUB_SB);
const NUEVO=prep(process.argv[2]||'trabajo.html');
/* opcional: la versión anterior de index.html, para comparar que todas las pantallas se vean igual */
const ORIGINAL=process.argv[3]&&fs.existsSync(process.argv[3])?prep(process.argv[3]):null;
const MAZOS_DIR=process.argv[4]||[require('path').join(__dirname,'..','..','estudiar','mazos'),'uapp/estudiar/mazos'].find(p=>fs.existsSync(p));
const DATOS={}; fs.readdirSync(MAZOS_DIR).filter(f=>f.endsWith('.json')).forEach(f=>DATOS[f.slice(0,-5)]=JSON.parse(fs.readFileSync(MAZOS_DIR+'/'+f,'utf8')));
function abrir(html,fecha,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const clic=(doc,sel)=>{const b=doc.querySelector(sel); if(b) b.click(); return !!b;};
/* red controlada: cada descarga queda esperando hasta que la prueba la suelta */
function diferida(w){ const pend=[]; w.fetch=u=>new Promise((res,rej)=>pend.push({u:String(u),res,rej}));
  return {pend, soltar(i){ const p=pend[i]; const k=/mazos\/([a-z0-9-]+)\.json/.exec(p.u)[1]; const txt=JSON.stringify(DATOS[k]);
    const r={ok:true,status:200,json:()=>Promise.resolve(w.JSON.parse(txt)),clone(){return r;}}; p.res(r); }}; }
/* un avance guardado realista: tarjetas vistas en dos ramos, con repasos vencidos, dominadas y una racha */
const TO=DATOS['teoria-obligaciones'], idsTO=TO.tarjetas.filter(t=>t.u===2).slice(0,6).map(t=>t.id);
const PROG={c:{
  'acto-juridico/aj01':{iv:3,ef:2.5,n:1,l:0,u:'v',due:'2026-10-14',f:'2026-10-11'},
  'acto-juridico/aj02':{iv:1,ef:2.35,n:2,l:0,u:'a',due:'2026-10-12',f:'2026-10-11'},
  'acto-juridico/aj03':{iv:1,ef:2.3,n:1,l:1,u:'r',due:'2026-10-13',f:'2026-10-12',rh:'2026-10-12'},
  'acto-juridico/aj04':{iv:25,ef:2.6,n:5,l:0,u:'v',due:'2026-11-05',f:'2026-10-11'}},
  h:{'2026-10-12':{v:2,a:1,r:1,ok:2,tot:3},'2026-10-13':{v:1,a:0,r:0,ok:0,tot:0}},
  p:{'acto-juridico':{int:[{f:'2026-10-12',ok:7,tot:10}]},'acto-juridico#art':{int:[{f:'2026-10-12',ok:5,tot:10}]}},
  n:{'2026-10-13':3},cfg:{nuevas:20},r:[],rep:{}};
idsTO.forEach((id,i)=>{ PROG.c['teoria-obligaciones/'+id]={iv:i<3?1:30,ef:2.5,n:2,l:0,u:i<3?'a':'v',due:i<3?'2026-10-12':'2026-11-20',f:'2026-10-11'}; });
const LS={'uapp_estudio_v1':JSON.stringify(PROG)};

/* recorre todas las pantallas de Estudiar que no necesitan el contenido y guarda lo que muestran */
async function recorrido(html,nuevo){
  const d=abrir(html,[2026,9,13,10,0],LS), w=d.window, doc=w.document; await sleep(1100);
  if(nuevo) w.fetch=()=>new Promise(()=>{});   /* el contenido nunca llega: todo sale del índice */
  const out={}, app=()=>doc.getElementById('estudioApp').innerHTML;
  out.inicio=doc.getElementById('repasoBox').innerHTML;
  clic(doc,'.tab[data-tab="pru"]'); await sleep(100); clic(doc,'#pru [data-ir="estudio"]'); await sleep(100);
  out.portada=app();
  for(const L of w.__estudio.lineas){
    clic(doc,'[data-es="lineas"]'); await sleep(20); clic(doc,'[data-es="linea"][data-v="'+L.id+'"]'); await sleep(20);
    out['línea '+L.id]=app();
    const ramos=[...doc.querySelectorAll('#estudioApp [data-es="abrir"]')].map(b=>b.getAttribute('data-v'));
    for(const m of ramos){
      clic(doc,'[data-es="abrir"][data-v="'+m+'"]'); await sleep(20); out['ramo '+m]=app();
      if(clic(doc,'[data-es="temas"]')){ await sleep(20); out['temas '+m]=app();
        clic(doc,'[data-es="tema"][data-v="2"]'); await sleep(20); out['temas '+m+' (2)']=app();
        clic(doc,'[data-es="temas-todos"]'); await sleep(20); out['temas '+m+' (todos)']=app();
        clic(doc,'[data-es="ramo"]'); await sleep(20); }
      clic(doc,'[data-es="ramos"]'); await sleep(20);
    }
  }
  w.close(); return out;
}

(async()=>{try{
  /* ═══ 1. Todo se ve igual que antes, sin descargar ningún mazo ═══ */
  if(ORIGINAL){
  const A=await recorrido(ORIGINAL,false), B=await recorrido(NUEVO,true);
  const claves=Object.keys(A), distintas=claves.filter(k=>A[k]!==B[k]);
  ok('Mismas pantallas que antes: '+claves.length+' vistas comparadas (Inicio, portada, 9 líneas, 17 ramos y sus temas)', claves.length>=30 && claves.join()===Object.keys(B).join());
  ok('  idénticas, aunque el contenido de los ramos no se descargó'+(distintas.length?' — distintas: '+distintas.slice(0,4).join(', '):''), distintas.length===0);
  ok('  el recorrido incluye la portada con racha, «Repaso de hoy», los ramos con temas y la opción Artículos', /Racha de/.test(A.portada) && /Repaso de hoy/.test(A.inicio) && /Artículos/.test(A['ramo acto-juridico']) && !!A['temas teoria-obligaciones (2)']);
  }

  /* ═══ 2. El índice coincide con los mazos ═══ */
  let d=abrir(NUEVO,[2026,9,13,10,0]), w=d.window, doc=w.document; await sleep(1100);
  const IX=w.__estudio.indice, ks=Object.keys(IX);
  ok('El índice trae los 17 mazos en el orden de siempre', ks.length===17 && ks[0]==='acto-juridico' && ks.join()===Object.keys(w.__estudio.mazos).join());
  const malEsq=ks.filter(k=>{ const M=w.__estudio.mazos[k], D=DATOS[k];
    const a=M.tarjetas.map(t=>t.id+':'+(t.u==null?'':t.u)).join(), b=D.tarjetas.map(t=>t.id+':'+(t.u==null?'':t.u)).join();
    const c=M.preguntas.map(t=>t.id+':'+(t.u==null?'':t.u)).join(), e=D.preguntas.map(t=>t.id+':'+(t.u==null?'':t.u)).join();
    return a!==b||c!==e||M.ramo!==D.ramo||M.nota!==D.nota||JSON.stringify(M.temas||null)!==JSON.stringify(D.temas||null); });
  ok('  cada mazo: mismos códigos, temas, ramo y nota que su archivo', malEsq.length===0);
  ok('  el esqueleto no trae el contenido (ni términos ni preguntas)', !w.__estudio.mazos['bienes'].tarjetas[0].t && !w.__estudio.mazos['bienes'].preguntas[0].q);
  await sleep(3700);
  ok('Sin avance guardado, la app no descarga ningún mazo al abrir', w.__fetchLog.length===0);
  await Promise.all(ks.map(k=>w.__estudio.cargar(k)));
  ok('  al cargar cada mazo llega completo', ks.every(k=>w.__estudio.listos[k] && w.__estudio.mazos[k].tarjetas.length===DATOS[k].tarjetas.length && !!w.__estudio.mazos[k].tarjetas[0].d));
  const malArt=ks.filter(k=>w.__estudio.articulos(k)!==IX[k].art);
  ok('  el conteo de «Artículos» del índice calza con el que calcula la app ('+ks.reduce((s,k)=>s+IX[k].art,0)+' reglas)', malArt.length===0);
  ok('  cada descarga usa la versión del mazo (…json?v=)', w.__fetchLog.length===17 && w.__fetchLog.every(u=>{ const m=/mazos\/([a-z0-9-]+)\.json\?v=([0-9a-f]+)$/.exec(u); return m&&IX[m[1]].v===m[2]; }));
  w.close();

  /* ═══ 3. Los ramos ya empezados se guardan solos para usarlos sin conexión ═══ */
  d=abrir(NUEVO,[2026,9,13,10,0],LS); w=d.window; doc=w.document; await sleep(1100);
  ok('Con avance guardado: Inicio ofrece el repaso sin descargar nada', /Repaso de hoy/.test(T(doc.getElementById('repasoBox'))) && w.__fetchLog.length===0);
  await sleep(3800);
  const bajados=w.__fetchLog.map(u=>/mazos\/([a-z0-9-]+)\.json/.exec(u)[1]).sort().join();
  ok('  a los pocos segundos se descargan solo los dos ramos empezados ('+bajados+')', bajados==='acto-juridico,teoria-obligaciones');
  w.close();

  /* ═══ 4. Mientras se descarga un ramo ═══ */
  d=abrir(NUEVO,[2026,9,13,10,0]); w=d.window; doc=w.document; await sleep(1100);
  let red=diferida(w);
  clic(doc,'.tab[data-tab="pru"]'); await sleep(80); clic(doc,'#pru [data-ir="estudio"]'); await sleep(80);
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="bienes"]'); await sleep(40);
  ok('Abrir un ramo muestra su pantalla al tiro y adelanta la descarga', T(doc.querySelector('#estudioApp h1'))==='Bienes' && red.pend.length===1 && /bienes\.json\?v=/.test(red.pend[0].u));
  clic(doc,'[data-es="tarjetas"]'); await sleep(40);
  const esp=doc.querySelector('#estudioApp .es-espera');
  ok('  si aún no llega, «Tarjetas» muestra «Descargando las tarjetas de Bienes…»', !!esp && esp.getAttribute('role')==='status' && /Descargando las tarjetas de Bienes/.test(T(esp)) && red.pend.length===1);
  red.soltar(0); await sleep(60);
  ok('  y al llegar empieza la sesión sola', !!doc.querySelector('#estudioApp .es-termino') && /1 de 16$/.test(T(doc.querySelector('#estudioApp .es-prog'))));
  const termino=T(doc.querySelector('#estudioApp .es-termino'));
  ok('  con una tarjeta de verdad de Bienes', DATOS['bienes'].tarjetas.some(t=>t.t===termino));
  w.close();

  /* ═══ 5. Sin conexión ═══ */
  d=abrir(NUEVO,[2026,9,13,10,0]); w=d.window; doc=w.document; await sleep(1100);
  w.__sinRed=true;
  clic(doc,'.tab[data-tab="pru"]'); await sleep(80); clic(doc,'#pru [data-ir="estudio"]'); await sleep(80);
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="derecho-familia"]'); await sleep(60);
  ok('Sin conexión, la pantalla del ramo igual se ve completa', T(doc.querySelector('#estudioApp h1'))==='Derecho de Familia' && /16 tarjetas|Para hoy: 16/.test(T(doc.getElementById('estudioApp'))));
  clic(doc,'[data-es="tarjetas"]'); await sleep(60);
  let al=doc.querySelector('#estudioApp [role="alert"]');
  ok('  «Tarjetas» explica que la primera vez se necesita internet', !!al && /Sin conexión/.test(T(al)) && /No se pudo descargar Derecho de Familia\. La primera vez que abres un ramo necesitas internet/.test(T(al)) && !!al.querySelector('[data-es="reintentar"]'));
  clic(doc,'[data-es="espera-volver"]'); await sleep(40);
  ok('  «Volver» regresa al ramo', T(doc.querySelector('#estudioApp h1'))==='Derecho de Familia' && !doc.querySelector('#estudioApp .es-espera'));
  clic(doc,'[data-es="preguntas"]'); await sleep(60);
  ok('  lo mismo con «Selección múltiple»', !!doc.querySelector('#estudioApp [role="alert"] [data-es="reintentar"]'));
  w.__sinRed=false; clic(doc,'[data-es="reintentar"]'); await sleep(80);
  ok('  al volver la conexión, «Reintentar» abre la ronda de preguntas', /Pregunta 1 de 8$/.test(T(doc.querySelector('#estudioApp .es-prog'))) && doc.querySelectorAll('#estudioApp .es-op').length===4);
  w.close();

  /* ═══ 5b. Conexión que no responde ═══ */
  d=abrir(NUEVO,[2026,9,13,10,0]); w=d.window; doc=w.document; await sleep(1100);
  red=diferida(w); w.__esperaMax=300;   /* en la app son 20 s */
  clic(doc,'.tab[data-tab="pru"]'); await sleep(80); clic(doc,'#pru [data-ir="estudio"]'); await sleep(80);
  clic(doc,'[data-es="linea"][data-v="procesal"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="recursos"]'); await sleep(40);
  clic(doc,'[data-es="tarjetas"]'); await sleep(450);
  ok('Si la descarga no responde, al rato se avisa con «Reintentar» (sin quedar pegado en «Cargando»)', !!doc.querySelector('#estudioApp [role="alert"] [data-es="reintentar"]'));
  red.soltar(0); await sleep(80);
  ok('  y si el contenido llega igual, la sesión empieza sola', !!doc.querySelector('#estudioApp .es-termino') && !doc.querySelector('#estudioApp .es-espera'));
  w.close();

  /* ═══ 6. «Repaso de hoy» desde Inicio ═══ */
  d=abrir(NUEVO,[2026,9,13,10,0],LS); w=d.window; doc=w.document; await sleep(1100);
  red=diferida(w);
  const rb=doc.querySelector('#repasoBox button');
  ok('Inicio: «Repaso de hoy» apunta al ramo con más vencidas ('+T(rb)+')', /Repaso de hoy 3 tarjetas de Teoría de las Obligaciones/.test(T(rb)));
  rb.click(); await sleep(60);
  ok('  al tocarlo, abre Estudiar y espera el contenido', !!doc.querySelector('#estudioApp .es-espera') && red.pend.length===1 && /teoria-obligaciones/.test(red.pend[0].u));
  red.soltar(0); await sleep(80);
  const t1=T(doc.querySelector('#estudioApp .es-termino'));
  ok('  y empieza por las vencidas del tema 2 ('+t1+')', /1 de \d+$/.test(T(doc.querySelector('#estudioApp .es-prog'))) && TO.tarjetas.filter(t=>idsTO.slice(0,3).includes(t.id)).some(t=>t.t===t1));
  w.close();

  /* ═══ 7. Temas: preguntas solo del tema elegido, esperando la descarga ═══ */
  d=abrir(NUEVO,[2026,9,13,10,0]); w=d.window; doc=w.document; await sleep(1100);
  red=diferida(w);
  clic(doc,'.tab[data-tab="pru"]'); await sleep(80); clic(doc,'#pru [data-ir="estudio"]'); await sleep(80);
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="teoria-obligaciones"]'); await sleep(40);
  clic(doc,'[data-es="temas"]'); await sleep(40); clic(doc,'[data-es="tema"][data-v="3"]'); await sleep(40);
  const nP3=Math.min(10,TO.preguntas.filter(p=>p.u===3).length);
  ok('Temas funciona sin el contenido: el tema 3 queda elegido con su conteo (Preguntas ('+nP3+'))', T(doc.querySelector('#estudioApp .es-tacc')).includes('Preguntas ('+nP3+')') && doc.querySelector('[data-es="tema"][data-v="3"]').getAttribute('aria-pressed')==='true');
  clic(doc,'[data-es="temas-preguntas"]'); await sleep(40);
  ok('  «Preguntas» espera la descarga', !!doc.querySelector('#estudioApp .es-espera'));
  red.soltar(0); await sleep(80);
  const q=T(doc.querySelector('#estudioApp .es-preg'));
  ok('  y la ronda trae preguntas del tema 3 ('+q.slice(0,50)+'…)', TO.preguntas.filter(p=>p.u===3).some(p=>p.q===q) && /tema|Tema|/.test(T(doc.querySelector('#estudioApp .es-filtro'))));
  w.close();
}catch(e){ R.push('ERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')); }
console.log(R.join('\n')); const f=R.filter(x=>!x.startsWith('✅')).length; console.log(f?'\n'+f+' con problemas':'\nTodo bien: '+R.length+' comprobaciones');
process.exit(0);})();
