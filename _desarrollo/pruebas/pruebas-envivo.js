/* v2.8 · modo en vivo: una sala con anfitrión y participante, con un servidor de mentira que se comporta
   como las funciones de _desarrollo/envivo.sql (crear, estado, mover, responder, resultados) */
const fs=require('fs'), path=require('path');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const STUB='<script>(function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};'+
 'window.supabase={createClient:function(){return {from:function(){return q},rpc:function(n,p){ if(!window.__srv) return Promise.reject(new TypeError("Failed to fetch")); try{ return Promise.resolve({data:window.__srv.rpc(n,JSON.parse(JSON.stringify(p))),error:null}); }catch(e){ return Promise.resolve({data:null,error:{message:e.message}}); } }}}};})();<\/script>';
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'trabajo.html'),'utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,STUB);
const BI=JSON.parse(fs.readFileSync(path.join(__dirname,'..','..','estudiar','mazos','bienes.json'),'utf8'));
function servidor(){
  const salas={}, resp=[]; let n=0;
  return {salas, resp, rpc(nombre,p){
    const s=salas[String(p.p_codigo||'').toUpperCase()];
    if(nombre==='vivo_crear'){ if(!/^[a-z0-9-]{1,60}$/.test(p.p_mazo)||!p.p_preguntas.length||p.p_preguntas.length>30||p.p_ordenes.length!==p.p_preguntas.length) throw new Error('Datos de la sala no válidos');
      const cod='K7P'+(10+(++n)), clave='clave'+n; salas[cod]={codigo:cod,clave,mazo:p.p_mazo,preguntas:p.p_preguntas,ordenes:p.p_ordenes,actual:-1,fase:'espera'}; return [{codigo:cod,clave}]; }
    if(nombre==='vivo_estado') return s?[{mazo:s.mazo,preguntas:s.preguntas,ordenes:s.ordenes,actual:s.actual,fase:s.fase,respuestas:resp.filter(r=>r.sala===s.codigo&&r.pregunta===s.actual).length}]:[];
    if(nombre==='vivo_mover'){ if(!s||s.clave!==p.p_clave||!['espera','pregunta','respuesta','fin'].includes(p.p_fase)) return false; s.actual=p.p_actual; s.fase=p.p_fase; return true; }
    if(nombre==='vivo_responder'){ if(!/^[a-f0-9]{8,64}$/.test(p.p_participante)||!s||s.fase!=='pregunta'||s.actual!==p.p_pregunta) return false;
      const ya=resp.find(r=>r.sala===s.codigo&&r.pregunta===p.p_pregunta&&r.participante===p.p_participante); if(ya) ya.opcion=p.p_opcion; else resp.push({sala:s.codigo,pregunta:p.p_pregunta,participante:p.p_participante,opcion:p.p_opcion}); return true; }
    if(nombre==='vivo_resultados'){ const c={}; resp.filter(r=>s&&r.sala===s.codigo&&r.pregunta===p.p_pregunta).forEach(r=>c[r.opcion]=(c[r.opcion]||0)+1); return Object.keys(c).map(k=>({opcion:+k,n:c[k]})); }
    throw new Error('función desconocida');
  }};
}
function abrir(srv){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(2026,10,12,10,0).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  w.__srv=srv; w.__evPausa=80; w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const clic=(doc,sel)=>{const b=doc.querySelector(sel); if(b) b.click(); return !!b;};
const ev=doc=>doc.getElementById('evApp');
const irEstudiar=async doc=>{ clic(doc,'.tab[data-tab="pru"]'); await sleep(100); clic(doc,'#pru [data-ir="estudio"]'); await sleep(100); };

(async()=>{try{
  const srv=servidor();
  /* ═══ anfitrión crea la sala ═══ */
  const dA=abrir(srv), wA=dA.window, A=wA.document; await sleep(1100);
  await irEstudiar(A); clic(A,'[data-es="linea"][data-v="civil"]'); await sleep(40); clic(A,'[data-es="abrir"][data-v="bienes"]'); await sleep(100);
  ok('El ramo ofrece crear una sala en vivo', /Crea una sala en vivo/.test(T(A.querySelector('[data-es="vivo-crear"]'))));
  clic(A,'[data-es="vivo-crear"]'); await sleep(120);
  const cant=[...ev(A).querySelectorAll('.ev-c')].map(T);
  ok('  se abre el panel para preparar la sala, con 5 u 8 preguntas ('+cant.join(', ')+')', !!ev(A)&&ev(A).getAttribute('role')==='dialog'&&cant.join()==='5,8'&&ev(A).querySelector('.ev-c.on')&&T(ev(A).querySelector('.ev-c.on'))==='8');
  clic(A,'[data-ev="crear"]'); await sleep(80);
  const sala=Object.values(srv.salas)[0];
  ok('Crear sala muestra el código grande ('+T(ev(A).querySelector('.ev-codigo'))+') y guarda 8 preguntas con su orden', !!sala&&T(ev(A).querySelector('.ev-codigo'))===sala.codigo&&sala.preguntas.length===8&&sala.ordenes.every(o=>/^[0-3]{4}$/.test(o)&&new Set(o).size===4)&&sala.mazo==='bienes');

  /* ═══ participante entra ═══ */
  const dB=abrir(srv), wB=dB.window, B=wB.document; await sleep(1100);
  await irEstudiar(B);
  ok('La portada de Estudiar ofrece «Modo en vivo · Unirme»', /Modo en vivo/.test(T(B.querySelector('[data-es="vivo-unirme"]'))));
  clic(B,'[data-es="vivo-unirme"]'); await sleep(60);
  B.getElementById('evCod').value='zzz99'; ev(B).querySelector('form').dispatchEvent(new wB.Event('submit',{cancelable:true,bubbles:true})); await sleep(150);
  ok('  un código que no existe se explica', /No encontramos esa sala/.test(T(ev(B))));
  B.getElementById('evCod').value=sala.codigo.toLowerCase(); ev(B).querySelector('form').dispatchEvent(new wB.Event('submit',{cancelable:true,bubbles:true})); await sleep(250);
  ok('  con el código correcto (aunque esté en minúsculas) espera a que empiece', /Esperando que empiece/.test(T(ev(B)))&&/Sala K7P11/.test(T(ev(B).querySelector('.ev-cab'))));

  /* ═══ primera pregunta ═══ */
  clic(A,'[data-ev="mover"][data-f="pregunta"]'); await sleep(250);
  const q0=BI.preguntas.find(q=>q.id===sala.preguntas[0]);
  ok('«Empezar» muestra la pregunta 1 al anfitrión, con 0 respuestas', T(ev(A).querySelector('.ev-preg'))===q0.q&&/0 respuestas/.test(T(ev(A).querySelector('.ev-cuenta'))));
  ok('  y le llega al participante con las alternativas en el mismo orden', T(ev(B).querySelector('.ev-preg'))===q0.q&&[...ev(B).querySelectorAll('.ev-op span')].map(T).join('|')===sala.ordenes[0].split('').map(Number).map(i=>q0.o[i]).join('|'));
  const btn=[...ev(B).querySelectorAll('.ev-op')].find(b=>T(b.querySelector('span'))===q0.o[q0.ok]);
  btn.click(); await sleep(150);
  ok('El participante responde y ve «Respuesta enviada»', /Respuesta enviada/.test(T(ev(B)))&&!!ev(B).querySelector('.ev-op.sel')&&srv.resp.length===1);
  await sleep(200);
  ok('  el anfitrión ve 1 respuesta al instante', /1 respuesta$/.test(T(ev(A).querySelector('.ev-cuenta'))));
  clic(A,'[data-ev="mover"][data-f="respuesta"]'); await sleep(250);
  ok('«Mostrar respuesta»: barras con el conteo y la correcta marcada', !!ev(A).querySelector('.ev-barra.ok')&&/1 respuesta/.test(T(ev(A).querySelector('.ev-barras')?.nextElementSibling))&&!!ev(A).querySelector('.ev-op.ok'));
  ok('  el participante ve que acertó, la explicación y el resultado del curso', /¡Correcta!/.test(T(ev(B).querySelector('.ev-por')))&&!!ev(B).querySelector('.ev-barras')&&T(ev(B).querySelector('.ev-por p'))===q0.por);
  const malas=srv.rpc('vivo_responder',{p_codigo:sala.codigo,p_participante:'abcdef0123456789',p_pregunta:0,p_opcion:1});
  ok('  con la respuesta mostrada ya no se aceptan respuestas', malas===false);

  /* ═══ hasta el final ═══ */
  for(let i=1;i<8;i++){ clic(A,'[data-ev="mover"][data-f="pregunta"]'); await sleep(60); clic(A,'[data-ev="mover"][data-f="respuesta"]'); await sleep(60); }
  clic(A,'[data-ev="mover"][data-f="fin"]'); await sleep(300);
  const res=[...ev(A).querySelectorAll('.ev-resumen li small')].map(T);
  ok('Al terminar, el anfitrión ve cuánto acertó el curso en cada pregunta ('+res[0]+')', res.length===8&&res[0]==='100 % acertó (1 de 1)'&&res[1]==='Sin respuestas');
  ok('  y el participante, su resultado', /Terminó la sala/.test(T(ev(B)))&&T(ev(B).querySelector('.ev-grande'))==='1 de 8');
  clic(B,'[data-ev="cerrar"]'); await sleep(40);
  ok('«Volver a UApp» cierra el panel', B.getElementById('evApp').style.display==='none'&&!B.documentElement.classList.contains('ev-abierto'));

  /* ═══ cerrar a mitad y sin servidor ═══ */
  clic(A,'[data-ev="cerrar"]'); await sleep(40);
  clic(A,'[data-es="vivo-crear"]'); await sleep(80); clic(A,'[data-ev="crear"]'); await sleep(80);
  const sala2=Object.values(srv.salas)[1];
  clic(A,'[data-ev="cerrar"]'); await sleep(80);
  ok('Si quien dirige cierra a mitad, la sala termina para todos', !!sala2&&sala2.fase==='fin');
  wB.__srv=null; clic(B,'[data-es="vivo-unirme"]'); await sleep(40);
  B.getElementById('evCod').value='K7P12'; ev(B).querySelector('form').dispatchEvent(new wB.Event('submit',{cancelable:true,bubbles:true})); await sleep(150);
  ok('Sin conexión con el servidor, lo dice', /Sin conexión con el servidor/.test(T(ev(B))));
  wA.close(); wB.close();
}catch(e){ R.push('ERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')); }
console.log(R.join('\n')); const f=R.filter(x=>!x.startsWith('✅')).length; console.log(f?'\n'+f+' con problemas':'\nTodo bien: '+R.length+' comprobaciones');
process.exit(0);})();
