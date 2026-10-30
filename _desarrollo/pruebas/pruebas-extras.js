const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const html=fs.readFileSync(process.argv[2]||'trabajo.html','utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,'<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>');
function abrir(url,fecha,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.URL.createObjectURL=()=>"blob:x";w.URL.revokeObjectURL=()=>{};
  w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const vis=el=>el&&el.style.display!=='none';
async function dona(doc,q){ doc.getElementById('abrirDona').click(); await sleep(80); const i=doc.getElementById('chatIn'); i.value=q; doc.getElementById('chatSend').click(); await sleep(500); const b=[...doc.querySelectorAll('#chatMsgs .cmsg.bot')]; return b[b.length-1]; }
(async()=>{try{
  /* ═══ 1 · horario al calendario ═══ */
  let d=abrir("https://miuapp.cl/?derechotech",[2026,9,5,10,0],{"insc_sec_v1_2026-T3":JSON.stringify({"32":"n9s1","33":"n9s1","34":"n9s1"})}), w=d.window, doc=w.document; await sleep(1200);
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(150);
  ok('Horario tiene el botón «Al calendario»', T(doc.getElementById('icsHor'))==='Al calendario');
  doc.getElementById('icsHor').click(); await sleep(100);
  const ics=w.__ultimoICSHorario||'', ev=ics.split('BEGIN:VEVENT').slice(1);
  ok('Genera el archivo con '+ev.length+' clases semanales (los bloques seguidos se unen)', /^BEGIN:VCALENDAR\r\n/.test(ics) && ev.length===4);
  const proc=ev.find(e=>/SUMMARY:Procedimientos/.test(e)&&/T191000/.test(e)&&/LOCATION:Sala/.test(e));
  ok('  Procedimientos los martes desde el 6 de octubre, hasta el 4 de diciembre', !!proc && /DTSTART:20261006T191000/.test(proc) && /RRULE:FREQ=WEEKLY;UNTIL=20261204T235959/.test(proc));
  ok('  la clase del jueves queda «En línea»', ev.some(e=>/SUMMARY:Procedimientos/.test(e)&&/LOCATION:En línea/.test(e)&&/DTSTART:20261008/.test(e)));
  const merc=ev.find(e=>/SUMMARY:Derecho Mercantil/.test(e));
  ok('  Mercantil, con sus dos bloques del miércoles unidos (19:10 a 22:00)', !!merc && /DTSTART:20261007T191000/.test(merc) && /DTEND:20261007T220000/.test(merc));
  const col=ev.find(e=>/SUMMARY:Derecho Colectivo/.test(e));
  ok('  el lunes 12 de octubre (feriado) queda fuera', !!col && /EXDATE:20261012T191000/.test(col));
  ok('  líneas dentro del estándar y saltos CRLF', Math.max(...ics.split('\r\n').map(l=>Buffer.byteLength(l)))<=75 && !/[^\r]\n/.test(ics));
  fs.writeFileSync(require('os').tmpdir()+'/horario_prueba.ics',ics);
  /* ═══ 2 · conversor de puntaje a nota ═══ */
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(80); doc.querySelector('#pru [data-ir="calc"]').click(); await sleep(150);
  const set=(id,v)=>{ const e=doc.getElementById(id); e.value=v; e.dispatchEvent(new w.Event('input')); };
  set('cvT','60'); set('cvE','60');
  const casos=[['36','4,0'],['45','5,1'],['30','3,5'],['0','1,0'],['60','7,0']]; let bien=true;
  for(const [p,n] of casos){ set('cvP',p); if(T(doc.querySelector('#cvR .cv-nota'))!==n) bien=false; }
  ok('Conversor: 36, 45, 30, 0 y 60 de 60 puntos dan 4,0, 5,1, 3,5, 1,0 y 7,0', bien);
  ok('  e indica con cuántos puntos se logra el 4,0', /el 4,0 se logra con 36 de 60 puntos/.test(T(doc.getElementById('cvR'))));
  set('cvP','70'); ok('  avisa si el puntaje supera el total', /entre 0 y 60/.test(T(doc.getElementById('cvR'))));
  /* ═══ 3 · fuente en Dona ═══ */
  let m=await dona(doc,'¿Cuándo empiezan las clases?');
  ok('Dona cita el Calendario Académico en las fechas', /Fuente: Calendario Académico 2026, Res\. de Rectoría N°289\/2025/.test(T(m)));
  m=await dona(doc,'¿Cuántos niveles puedo tomar al mismo tiempo?');
  ok('  y el artículo del Reglamento cuando la respuesta lo cita', /Fuente: Reglamento General del Estudiante de Pregrado, art\. 17/.test(T(m)) && !!m.querySelector('.dona-ver'));
  m.querySelector('.dona-ver').click(); await sleep(150);
  ok('  «Abrir» muestra el Reglamento en la app', /Reglamento/.test(T(doc.getElementById('docTitle'))));
  m=await dona(doc,'¿Cómo pido apoyo psicopedagógico?');
  ok('  sin fuente cuando no puede afirmarla', !!m && !m.querySelector('.dona-fuente'));
  /* ═══ 4 · guía para primer año ═══ */
  doc.querySelector('.tab[data-tab="info"]').click(); await sleep(120);
  const g=doc.querySelector('#guiaBox .guia');
  ok('Más: «Guía para primer año» con 10 preguntas', !!g && /Guía para primer año/.test(T(g.querySelector('summary'))) && g.querySelectorAll('.guia-q').length===10);
  const n0=doc.querySelectorAll('#chatMsgs .cmsg').length;
  g.querySelector('.guia-q').click(); await sleep(700);
  const ms=[...doc.querySelectorAll('#chatMsgs .cmsg')];
  ok('  tocar una pregunta abre Dona y la responde', vis(doc.getElementById('chatPanel')) && ms.length>=n0+2 && /asistencia/i.test(T(ms[ms.length-2])) && /70%/.test(T(ms[ms.length-1])));
  /* ═══ Diurno: la fuente del régimen semestral ═══ */
  d=abrir("https://miuapp.cl/?derechodiurno",[2026,9,5,10,0]); w=d.window; doc=w.document; await sleep(1200);
  m=await dona(doc,'¿Cuánta asistencia necesito?');
  ok('Diurno: Dona cita el art. 21 en asistencia', /Fuente: Reglamento General del Estudiante de Pregrado, art\. 21/.test(T(m)));
  /* ═══ 5 · Estudiar: LeyChile y revisión docente ═══ */
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(80); doc.querySelector('#pru [data-ir="estudio"]').click(); await sleep(120);
  doc.querySelector('[data-es="linea"][data-v="civil"]').click(); await sleep(60);
  doc.querySelector('[data-es="abrir"][data-v="acto-juridico"]').click(); await sleep(80);
  ok('Estudiar: el ramo avisa «Contenido en revisión docente»', /Contenido en revisión docente/.test(T(doc.getElementById('estudioApp'))));
  doc.querySelector('[data-es="tarjetas"]').click(); await sleep(80);
  let cc=null, doctr=null;
  for(let k=0;k<20&&!(cc&&doctr);k++){ doc.querySelector('.es-btn[data-es="voltear"]').click(); await sleep(20);
    const r=doc.querySelector('.es-dorso .es-ref'); if(r.tagName==='A') cc=cc||r; else doctr=doctr||r;
    doc.querySelector('.es-luz.v').click(); await sleep(20); }
  ok('  las fuentes del Código Civil enlazan a LeyChile', !!cc && cc.getAttribute('href')==='https://www.bcn.cl/leychile/navegar?idNorma=172986' && cc.getAttribute('target')==='_blank');
  ok('  y las de doctrina no llevan enlace', !!doctr && doctr.tagName==='SPAN');
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
