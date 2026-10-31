/* v2.8.1 · correcciones de la revisión técnica: respaldos que no pueden meter código, enlaces y salas con datos raros,
   la app pública sin la sesión del panel, el respaldo antiguo de Avance y la fecha de Chile en la solicitud */
process.env.TZ='America/Santiago';   /* la fecha de la solicitud se prueba con la hora de Chile */
const fs=require('fs'), path=require('path');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
/* Supabase de mentira: anota con qué opciones se creó el cliente y responde las funciones del modo en vivo con window.__sala */
const STUB='<script>(function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},limit:function(){return q},'+
 'insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};'+
 'window.supabase={createClient:function(u,k,o){window.__sbOpts=o||null;return {from:function(){return q},rpc:function(n,p){var s=window.__sala;'+
 'if(n==="vivo_estado") return Promise.resolve({data:s?[s]:[],error:null}); if(n==="vivo_resultados") return Promise.resolve({data:[],error:null});'+
 'if(n==="vivo_responder"){window.__respondio=(window.__respondio||0)+1; return Promise.resolve({data:true,error:null});} return Promise.resolve({data:null,error:null});}}}};})();</script>';
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'trabajo.html'),'utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,STUB);
const BI=JSON.parse(fs.readFileSync(path.join(__dirname,'..','..','estudiar','mazos','bienes.json'),'utf8'));
function abrir(fecha,ls,url){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:url||"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  w.__errores=[]; w.addEventListener('error',e=>w.__errores.push(String(e.message||e.error)));
  w.__abiertos=[];w.open=(u)=>{w.__abiertos.push(String(u));return null;};
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const clic=(doc,sel)=>{const b=doc.querySelector(sel); if(b) b.click(); return !!b;};
const app=doc=>doc.getElementById('estudioApp');
const irEstudiar=async doc=>{ clic(doc,'.tab[data-tab="pru"]'); await sleep(100); clic(doc,'#pru [data-ir="estudio"]'); await sleep(150); };
const XSS='"><img src=x onerror="window.__xss=1">';
const hoy='2026-11-12', ayer='2026-11-11';
/* ¿quedó algo inyectado? (una imagen o un atributo onerror dentro de Estudiar) */
const inyectado=doc=>!!app(doc).querySelector('img,[onerror],script');

(async()=>{try{
  /* ═══ 1 · un respaldo armado a mano con código en vez de números no se carga ═══ */
  let d=abrir([2026,10,12,10,0],{'jornada3_v1':'tech','malla_derecho_v4':'{"1":true}'}), w=d.window, doc=w.document; await sleep(1000);
  const malo={tipo:'uapp-respaldo',version:1,fecha:hoy,datos:{
    uapp_estudio_v1:JSON.stringify({c:{},h:{[ayer]:{v:XSS,a:0,r:0,ok:0,tot:0}},p:{bienes:{int:[{f:ayer,ok:XSS,tot:1}]}},n:{},cfg:{nuevas:XSS},r:[],rep:{}}),
    jornada3_v1:'tech'+XSS, uapp_otra_v1:'{}', malla_derecho_v4:'{"2":true}'}};
  let rv=w.__respaldo.revisar(malo);
  ok('Un respaldo con código en sus datos: solo se acepta lo que tiene la forma de UApp ('+(rv.claves||[]).join(', ')+'; '+rv.omitidas+' fuera)', rv.ok&&rv.claves.join()==='malla_derecho_v4'&&rv.omitidas===3);
  const r1=w.__respaldo.restaurar(malo), L=w.localStorage;
  ok('  al cargarlo no se guarda lo rechazado (Estudiar y la jornada quedan como estaban)', r1.ok&&L.getItem('uapp_estudio_v1')===null&&L.getItem('jornada3_v1')==='tech'&&L.getItem('malla_derecho_v4')==='{"2":true}');
  rv=w.__respaldo.revisar({tipo:'uapp-respaldo',version:1,fecha:hoy,datos:{jornada3_v1:'<b>x</b>',uapp_estudio_v1:'{"c":{"a/b":"<img>"}}'}});
  ok('  si nada se reconoce, se rechaza con un motivo claro ('+rv.motivo+')', !rv.ok&&/no tiene datos que UApp reconozca/.test(rv.motivo));
  rv=w.__respaldo.revisar({tipo:'uapp-respaldo',version:1,fecha:'<b>',datos:{'insc_sec_diurno_v1_2026-S2':'{"40":"n2s1"}','cierre_v1_insc_sec_v1':'{"21":"n6s1"}','malla_sel_diurno_v1':'noajustada','uapp_req_v1':'1','tercera_v1':'[21,33]','notas_tech_v1':'{"21":["55",null,"6,1"]}','uapp_a11y_v1':'{"theme":"dark","font":"1.15","motion":true}'}});
  ok('  y los datos reales de todas las jornadas pasan ('+(rv.claves||[]).length+' de 7; fecha rara ignorada)', rv.ok&&rv.claves.length===7&&rv.omitidas===0&&rv.fecha==='');
  w.close();

  /* ═══ 2 · lo que ya estaba guardado con texto donde van números se limpia al abrir Estudiar ═══ */
  const sucio={c:{'bienes/bi01':{iv:3,ef:2.5,n:1,l:0,u:'v',due:'2026-11-15',f:hoy},'bienes/bi02':{iv:'x',ef:'<b>',n:1,l:0,u:XSS,due:XSS},'constructor':{due:hoy}},
    h:{[ayer]:{v:XSS,a:1,r:0,ok:0,tot:0},[hoy]:{v:2,a:0,r:0,ok:1,tot:1},[XSS]:{v:1}},
    p:{bienes:{int:[{f:ayer,ok:XSS,tot:1},{f:ayer,ok:3,tot:4},{f:ayer,ok:9,tot:4}]},'bienes#sim':{int:[{f:ayer,ok:1,tot:2,nota:XSS}]},'bienes#art':{int:[{f:ayer,ok:XSS,tot:XSS}]}},
    n:{[hoy]:XSS}, cfg:{nuevas:XSS}, r:[[hoy,'bienes','bi01','v'],[XSS,'bienes','bi01','v'],[hoy,'bienes',XSS,1]], rep:{'bienes/bi03':hoy,'bienes/bi04':XSS}};
  d=abrir([2026,10,12,10,0],{'jornada3_v1':'tech','uapp_estudio_v1':JSON.stringify(sucio)}); w=d.window; doc=w.document; await sleep(1000);
  await irEstudiar(doc);
  ok('La portada de Estudiar no dibuja el código guardado (calendario de actividad)', !inyectado(doc)&&!!app(doc).querySelector('.es-cal'));
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="bienes"]'); await sleep(300);
  ok('  ni el ramo (mejor resultado, simulacros, ajuste de nuevas): '+T(app(doc).querySelector('[data-es="preguntas"] .es-chip')), !inyectado(doc)&&/Tu mejor resultado: 3 de 4/.test(T(app(doc))));
  const E=w.__estudio.estado();
  ok('  y lo bueno se conserva: la tarjeta válida, el día de hoy y el registro correcto', !!E.c['bienes/bi01']&&!E.c['bienes/bi02']&&!Object.prototype.hasOwnProperty.call(E.c,'constructor')&&E.h[hoy].v===2&&typeof E.h[ayer].v==='number'&&E.r.length===1&&E.rep['bienes/bi03']===hoy&&!E.rep['bienes/bi04']&&E.cfg.nuevas===undefined);
  ok('  sin errores de JavaScript ni código ejecutado', !w.__xss&&!w.__errores.length);
  w.close();

  /* ═══ 3 · enlaces de desafío raros ═══ */
  for(const [nombre,h] of [['«constructor» como ramo','#desafio?m=constructor&q=x1,x2&r=1-2'],['«__proto__» como ramo','#desafio?m=__proto__&q=x1'],['un enlace cortado (%E0)','#desafio?m=bienes&q=%E0%A4%A']]){
    d=abrir([2026,10,12,10,0],null,'https://miuapp.cl/?derechotech'+h); w=d.window; doc=w.document; await sleep(1100);
    ok('Un desafío con '+nombre+' no abre nada ni rompe la app', !app(doc).querySelector('.es-prog')&&!w.__errores.length&&!!app(doc).querySelector('.es-lineas,.h1'));
    w.close();
  }
  const qs=BI.preguntas.slice(0,2).map(q=>q.id).join(',');
  d=abrir([2026,10,12,10,0],null,'https://miuapp.cl/?derechotech#desafio?m=bienes&t=p&q='+qs+'&r=9-2'); w=d.window; doc=w.document; await sleep(1300);
  ok('  un puntaje imposible (9 de 2) no se muestra como «quien te desafió sacó»', !!app(doc).querySelector('.es-preg')&&!/te desafió/.test(T(app(doc))));
  w.close();

  /* ═══ 4 · sala en vivo con datos fuera de rango ═══ */
  for(const [nombre,sala] of [['una pregunta fuera de la lista',{mazo:'bienes',preguntas:BI.preguntas.slice(0,3).map(q=>q.id),ordenes:['0123','0123','0123'],actual:7,fase:'pregunta',respuestas:'<b>3</b>'}],
                              ['«constructor» como ramo',{mazo:'constructor',preguntas:['x'],ordenes:['0123'],actual:0,fase:'pregunta',respuestas:0}]]){
    d=abrir([2026,10,12,10,0]); w=d.window; doc=w.document; await sleep(1000); w.__sala=sala;
    await irEstudiar(doc); clic(doc,'[data-es="vivo-unirme"]'); await sleep(60);
    const ev=doc.getElementById('evApp');
    doc.getElementById('evCod').value='K7P11'; ev.querySelector('form').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true})); await sleep(300);
    ok('Una sala en vivo con '+nombre+' muestra un aviso, sin romperse ('+T(ev).slice(0,70)+'…)', !w.__errores.length&&/Esperando la siguiente pregunta|ramo que tu UApp no tiene/.test(T(ev)));
    w.close();
  }

  /* ═══ 5 · la app pública consulta como anónima, sin la sesión del panel ═══ */
  d=abrir([2026,10,12,10,0]); w=d.window; doc=w.document; await sleep(900);
  const o=w.__sbOpts&&w.__sbOpts.auth||{};
  ok('El cliente de Supabase de la app no guarda ni lee sesiones (storageKey propio)', o.persistSession===false&&o.autoRefreshToken===false&&o.detectSessionInUrl===false&&o.storageKey==='uapp-publica');

  /* ═══ 6 · Avance ya no tiene el respaldo antiguo: el botón lleva a Más › Respaldo ═══ */
  ok('Avance tiene un solo botón de respaldo y no el antiguo (que copiaba todo, también el RUT)', !!doc.getElementById('bkIr')&&!doc.getElementById('bkExp')&&!doc.getElementById('bkImp')&&!doc.getElementById('bkFile')&&typeof w.importData==='undefined');
  doc.getElementById('bkIr').click(); await sleep(150);
  ok('  y abre Más, donde está «Respaldo de tus datos»', doc.getElementById('info').style.display!=='none'&&!!doc.querySelector('#respaldoBox .rs-card'));
  w.close();

  /* ═══ 7 · la solicitud de toma de carga usa el día de Chile ═══ */
  d=abrir([2026,10,30,22,30]); w=d.window; doc=w.document; await sleep(900);   /* 30 de noviembre, 22:30 en Chile = 1 de diciembre en Greenwich */
  w.SOLICITUD.activo=true; w.SOLICITUD.desde='2026-11-01'; w.SOLICITUD.hasta='2026-11-30';
  ok('El último día de la solicitud sigue abierta a las 22:30 (antes se cerraba a las 21:00)', w.solicitudVigente()===true);
  w.SOLICITUD.hasta='2026-11-29';
  ok('  y al día siguiente del plazo ya no', w.solicitudVigente()===false);
  w.close();
}catch(e){ R.push('ERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')); }
console.log(R.join('\n')); const f=R.filter(x=>!x.startsWith('✅')).length; console.log(f?'\n'+f+' con problemas':'\nTodo bien: '+R.length+' comprobaciones');
process.exit(0);})();
