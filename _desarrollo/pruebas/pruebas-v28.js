/* v2.8 · desafío por enlace (mismas preguntas, mismo orden, resultado para comparar) y respaldo del avance en un archivo */
const fs=require('fs'), path=require('path');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const STUB_SB='<script>window.__ins=[];window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(row){window.__ins.push([q._t,row]);return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(t){q._t=t;return q},rpc:function(){return Promise.resolve({data:null,error:{message:"sin servidor en la prueba"}})}}}};<\/script>';
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'trabajo.html'),'utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,STUB_SB);
const DIR=path.join(__dirname,'..','..','estudiar','mazos'), mazo=k=>JSON.parse(fs.readFileSync(path.join(DIR,k+'.json'),'utf8'));
function abrir(fecha,ls,url){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:url||"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  w.__abiertos=[];w.open=(u)=>{w.__abiertos.push(String(u));return null;};
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const clic=(doc,sel)=>{const b=doc.querySelector(sel); if(b) b.click(); return !!b;};
const app=doc=>doc.getElementById('estudioApp');
const BI=mazo('bienes');
const preguntaActual=doc=>BI.preguntas.find(x=>x.q===T(app(doc).querySelector('.es-preg')));
const botonDe=(doc,txt)=>[...app(doc).querySelectorAll('.es-op')].find(b=>T(b.querySelector('span'))===txt);

(async()=>{try{
  /* ═══ desafío: quien desafía ═══ */
  let d=abrir([2026,10,12,10,0]), w=d.window, doc=w.document; await sleep(1100);
  clic(doc,'.tab[data-tab="pru"]'); await sleep(100); clic(doc,'#pru [data-ir="estudio"]'); await sleep(100);
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="bienes"]'); await sleep(80);
  clic(doc,'[data-es="preguntas"]'); await sleep(120);
  const orden=[], ordOpc=[];
  for(let i=0;i<8;i++){ const q=preguntaActual(doc); orden.push(q.id); ordOpc.push([...app(doc).querySelectorAll('.es-op span')].map(s=>q.o.indexOf(T(s))).join(''));
    botonDe(doc,i<6?q.o[q.ok]:q.o[(q.ok+1)%4]).click(); await sleep(20); clic(doc,'[data-es="sig"]'); await sleep(20); }
  ok('Al terminar una ronda (6 de 8), aparecen «Desafiar por WhatsApp» y «Copiar enlace»', /^Resultado/.test(T(app(doc).querySelector('.es-fin')))&&!!app(doc).querySelector('[data-es="desafiar"]')&&!!app(doc).querySelector('[data-es="desafio-copiar"]'));
  const bd=app(doc).querySelector('.es-fin .es-desafio'), lm=app(doc).querySelector('.es-fin .es-malas');
  ok('  justo bajo el resultado, antes de «Para repasar» (no hay que bajar para verlos)', !!bd&&!!lm&&!!(bd.compareDocumentPosition(lm)&4));
  clic(doc,'[data-es="desafiar"]'); await sleep(30);
  const wa=w.__abiertos[0]||'', texto=decodeURIComponent((/text=(.*)$/.exec(wa)||[])[1]||'');
  const enlace=(/(https:\/\/miuapp\.cl\/#desafio\?\S+)/.exec(texto)||[])[1]||'';
  ok('  abre WhatsApp con el mensaje y el enlace ('+texto.slice(0,70)+'…)', /^https:\/\/wa\.me\/\?text=/.test(wa)&&/^Te desafío en UApp: 8 preguntas de Bienes\. Yo saqué 6 de 8\. ¿Me ganas\?/.test(texto)&&!!enlace);
  const p=new URLSearchParams(enlace.split('#desafio?')[1]);
  ok('  el enlace lleva el ramo, las mismas preguntas en el mismo orden, las alternativas y el puntaje', p.get('m')==='bienes'&&p.get('t')==='p'&&p.get('q')===orden.join(',')&&p.get('o')===ordOpc.join('-')&&p.get('r')==='6-8');
  ok('  sin nombres ni datos del teléfono', !/nombre|rut|correo/i.test(enlace)&&enlace.length<400);
  clic(doc,'[data-es="desafio-copiar"]'); await sleep(40);
  const caja=app(doc).querySelector('.es-enlace textarea');
  ok('  «Copiar enlace» sin portapapeles deja el mensaje a mano para copiarlo', !!caja&&caja.value.includes(enlace));
  w.close();

  /* ═══ desafío: quien lo recibe ═══ */
  d=abrir([2026,10,12,10,0],null,enlace.replace('https://miuapp.cl/','https://miuapp.cl/?derechotech')); w=d.window; doc=w.document; await sleep(1300);
  const q1=preguntaActual(doc);
  ok('Abrir el enlace lleva directo al desafío: la misma primera pregunta', vis(doc)&&!!q1&&q1.id===orden[0]&&/1 de 8$/.test(T(app(doc).querySelector('.es-prog'))));
  ok('  con las alternativas en el mismo orden', [...app(doc).querySelectorAll('.es-op span')].map(s=>q1.o.indexOf(T(s))).join('')===ordOpc[0]);
  ok('  y el enlace se borra de la barra de direcciones', w.location.hash==='');
  ok('  mientras responde, recuerda el puntaje a superar', /Desafío: quien te desafió sacó 6 de 8/.test(T(app(doc))));
  for(let i=0;i<8;i++){ const q=preguntaActual(doc); botonDe(doc,q.o[q.ok]).click(); await sleep(20); clic(doc,'[data-es="sig"]'); await sleep(20); }
  const fin=T(app(doc).querySelector('.es-fin'));
  ok('Al terminar compara con quien desafió ('+T(app(doc).querySelector('.es-reto'))+')', T(app(doc).querySelector('.es-fin .es-etq'))==='Desafío'&&T(app(doc).querySelector('.es-fin .es-grande'))==='8 de 8'&&/Quien te desafió sacó 6 de 8\. ¡Ganaste!/.test(fin));
  clic(doc,'[data-es="desafiar"]'); await sleep(30);
  const resp=decodeURIComponent((/text=(.*)$/.exec(w.__abiertos[0]||'')||[])[1]||'');
  ok('  y «Responder por WhatsApp» devuelve el resultado con un enlace nuevo ('+resp.slice(0,60)+'…)', /^Hice tu desafío de Bienes en UApp: saqué 8 de 8; tú, 6 de 8\. ¿Otra\?/.test(resp)&&/r=8-8/.test(resp));
  const E=w.__estudio.estado();
  ok('  las respuestas cuentan en el registro, aparte de las rondas normales', E.r.filter(x=>x[1]==='bienes').length===8&&E.p['bienes#desafio'].int.length===1&&!E.p['bienes']);
  w.close();

  /* ═══ desafío con tiempo y enlaces inválidos ═══ */
  const qs=BI.preguntas.slice(0,3).map(q=>q.id).join(','), url2='https://miuapp.cl/?derechotech#desafio?m=bienes&t=s&q='+qs+'&o=0123-9999-3210&r=2-3';
  d=abrir([2026,10,12,10,0],null,url2); w=d.window; doc=w.document; await sleep(1300);
  const pr=[...app(doc).querySelectorAll('.es-prog > *')].map(T).filter(Boolean).join(' ');
  ok('Un desafío de simulacro llega con tiempo: 3 preguntas, 3:00 ('+pr+')', /3:00 1 de 3/.test(pr));
  const qa=preguntaActual(doc);
  ok('  un orden inválido de alternativas se reemplaza por uno al azar (sin romper)', !!qa&&app(doc).querySelectorAll('.es-op').length===4);
  w.close();
  d=abrir([2026,10,12,10,0],null,'https://miuapp.cl/?derechotech#desafio?m=no-existe&q=x1,x2'); w=d.window; doc=w.document; await sleep(1200);
  ok('Un enlace a un ramo que no existe no hace nada', !w.document.querySelector('#estudioApp .es-prog')&&!w.document.querySelector('#estudioApp .es-espera'));
  w.close();

  /* ═══ respaldo ═══ */
  const LS={'uapp_estudio_v1':JSON.stringify({c:{'bienes/bi01':{iv:3,ef:2.5,n:1,l:0,u:'v',due:'2026-11-15',f:'2026-11-12'},'bienes/bi02':{iv:1,ef:2.3,n:1,l:0,u:'a',due:'2026-11-13',f:'2026-11-12'}},h:{},p:{},n:{},cfg:{},r:[],rep:{}}),
    'jornada3_v1':'tech','insc_sec_v1_2026-T3':'{"21":"n6s1"}','malla_derecho_v4':'{"1":true}','uapp_notas_carrera_v1':'{"x":1}',
    'visita_v1':'2026-11-12','evdet_v1_tech':'[]','rut_v1':'12345678'};
  d=abrir([2026,10,12,10,0],LS); w=d.window; doc=w.document; await sleep(1100);
  const card=doc.querySelector('#info #respaldoBox .rs-card');
  ok('Más tiene «Respaldo de tus datos» con descargar y cargar', !!card&&/Respaldo de tus datos/.test(T(card))&&!!card.querySelector('[data-rs="bajar"]')&&!!card.querySelector('[data-rs="elegir"]'));
  const o=w.__respaldo.armar(), ks=Object.keys(o.datos);
  ok('El respaldo trae el avance, la malla, las notas, los ramos y la jornada ('+ks.join(', ')+')', o.tipo==='uapp-respaldo'&&o.fecha==='2026-11-12'&&['uapp_estudio_v1','jornada3_v1','insc_sec_v1_2026-T3','malla_derecho_v4','uapp_notas_carrera_v1'].every(k=>ks.includes(k)));
  ok('  y no trae el RUT, el contador de visitas ni las copias de evaluaciones', !ks.includes('rut_v1')&&!ks.includes('visita_v1')&&!ks.includes('evdet_v1_tech'));
  const rv=w.__respaldo.revisar(o);
  ok('Revisar un respaldo resume lo que trae ('+rv.resumen.join(', ')+')', rv.ok&&/2 tarjetas vistas en Estudiar/.test(rv.resumen.join())&&/tu avance en la malla/.test(rv.resumen.join())&&/tus ramos inscritos/.test(rv.resumen.join())&&/tus notas/.test(rv.resumen.join()));
  ok('  un archivo que no es respaldo se rechaza con un motivo claro', w.__respaldo.revisar({a:1}).motivo==='Este archivo no es un respaldo de UApp.'&&w.__respaldo.revisar({tipo:'uapp-respaldo',version:9,datos:{x:'1'}}).motivo.includes('más nueva'));
  w.close();
  /* otro teléfono: tenía otros datos; al cargar queda igual al primero */
  d=abrir([2026,10,12,10,0],{'uapp_estudio_v1':'{"c":{},"h":{},"p":{},"n":{},"cfg":{},"r":[],"rep":{}}','malla_noajustada_v1':'{"9":true}','jornada3_v1':'diurno','rut_v1':'999'}); w=d.window; doc=w.document; await sleep(1100);
  const r2=w.__respaldo.restaurar(o), L=w.localStorage;
  ok('Cargar el respaldo en otro teléfono deja sus datos iguales al primero', r2.ok&&L.getItem('uapp_estudio_v1')===LS.uapp_estudio_v1&&L.getItem('jornada3_v1')==='tech'&&L.getItem('malla_derecho_v4')==='{"1":true}'&&L.getItem('malla_noajustada_v1')===null);
  ok('  sin tocar lo que no es parte del respaldo (el RUT de ese teléfono sigue)', L.getItem('rut_v1')==='999');
  w.close();
}catch(e){ R.push('ERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')); }
console.log(R.join('\n')); const f=R.filter(x=>!x.startsWith('✅')).length; console.log(f?'\n'+f+' con problemas':'\nTodo bien: '+R.length+' comprobaciones');
process.exit(0);})();
function vis(doc){ const s=doc.getElementById('estudio'); return !!s&&s.style.display!=='none'; }
