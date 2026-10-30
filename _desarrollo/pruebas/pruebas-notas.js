const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
const stub=`<script>(function(){
  function Q(t){this.t=t;this.f=[];}
  Q.prototype.select=function(){return this;}; Q.prototype.order=function(){return this;};
  Q.prototype.eq=function(k,v){this.f.push(function(r){return r[k]===v;});return this;};
  Q.prototype.gte=function(k,v){this.f.push(function(r){return String(r[k])>=String(v);});return this;};
  Q.prototype.insert=function(){return Promise.resolve({error:null});};
  Q.prototype.then=function(ok,ko){var T=(window.__TABLAS||{})[this.t],self=this;
    return Promise.resolve({data:(T||[]).filter(function(r){return self.f.every(function(fn){return fn(r);});}),error:null}).then(ok,ko);};
  window.supabase={createClient:function(){return {from:function(t){return new Q(t);}};}};
})();<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
const dia=n=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
let confirmados=0;
function abrir(url,tablas,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){ w.__TABLAS=tablas||{}; Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));
    w.URL.createObjectURL=()=>"blob:x"; w.URL.revokeObjectURL=()=>{};
    w.scrollTo=()=>{};w.confirm=()=>{confirmados++;return true;};w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const visible=el=>el && el.style.display!=='none';
const DET=[{jornada:'tech',fecha:dia(1),asignatura:'Derecho Mercantil',seccion:'S1',hora:'19:10',modalidad:'presencial',sala:'TEA SH-43',docente:'Jean Paul Thiers Thiers'},
           {jornada:'tech',fecha:dia(1),asignatura:'Derecho Mercantil',seccion:'S2',hora:'19:10',modalidad:'presencial',sala:'TEA SH-44',docente:'Otro'}];
(async()=>{try{
  let d=abrir("https://miuapp.cl/?derechotech",{evaluaciones:DET,avisos:[]},{"insc_sec_v1_2026-T3":JSON.stringify({"33":"n9s1"})}); await sleep(1200);
  let w=d.window, doc=w.document;
  /* ═══ Pestañas ═══ */
  const tabs=[...doc.querySelectorAll('.tab')].filter(t=>t.style.display!=='none').map(T);
  ok('5 secciones: '+tabs.join(' · '), tabs.join('|')==='Inicio|Horario|Notas|Avance|Más');
  /* ═══ Fechas / Simulador ═══ */
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(300);
  ok('«Notas» abre en Fechas', visible(doc.getElementById('pru')) && !visible(doc.getElementById('calc')));
  doc.querySelector('#pru [data-ir="calc"]').click(); await sleep(300);
  ok('«Simulador» cambia a la calculadora', visible(doc.getElementById('calc')) && !visible(doc.getElementById('pru')));
  ok('  y la sección sigue marcada como «Notas»', doc.querySelector('.tab.active') && doc.querySelector('.tab.active').dataset.tab==='pru');
  ok('  el Simulador sigue armándose con tus ramos', /Derecho Mercantil/.test(T(doc.getElementById('calcCards'))));
  doc.querySelector('#calc [data-ir="pru"]').click(); await sleep(300);
  ok('«Fechas» vuelve al calendario', visible(doc.getElementById('pru')));
  /* ═══ Al calendario: tus ramos ═══ */
  confirmados=0; doc.getElementById('icsPru').click(); await sleep(200);
  const ics=w.__ultimoICS||'';
  ok('Genera el archivo de calendario', /^BEGIN:VCALENDAR\r\n/.test(ics) && /END:VCALENDAR\r\n$/.test(ics));
  ok('  sin preguntar, porque tienes ramos marcados', confirmados===0);
  ok('  Mercantil del calendario oficial (21 oct, día completo)', /SUMMARY:Derecho Mercantil: 1ª prueba\r\n/.test(ics) && /DTSTART;VALUE=DATE:20261021/.test(ics));
  const ymd=dia(1).replace(/-/g,'');
  ok('  la evaluación publicada de tu sección, con hora y sala', ics.includes('DTSTART:'+ymd+'T191000') && /LOCATION:Sala TEA SH-43/.test(ics));
  ok('  sin la sección ajena (S2)', !/TEA SH-44/.test(ics));
  ok('  ni ramos que no cursas', !/Sucesorio|Tributario|Procedimientos de Ejecuci/.test(ics));
  const nEv=(ics.match(/BEGIN:VEVENT/g)||[]).length, nAl=(ics.match(/BEGIN:VALARM/g)||[]).length;
  ok('  cada evento ('+nEv+') trae aviso el día anterior', nEv>0 && nEv===nAl && /TRIGGER:-P1D/.test(ics));
  const lineas=ics.split('\r\n'); const largo=Math.max(...lineas.map(l=>Buffer.byteLength(l,'utf8')));
  ok('  líneas dentro del estándar (máx. '+largo+' de 75 bytes) y saltos CRLF', largo<=75 && !/[^\r]\n/.test(ics));
  ok('  y avisa cómo usarlo', /abre el archivo descargado/.test(T(doc.getElementById('horToast'))));
  /* ═══ Al calendario: sin ramos marcados ═══ */
  d=abrir("https://miuapp.cl/?derechotech",{evaluaciones:[],avisos:[]}); await sleep(1100); w=d.window; doc=w.document;
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(250);
  confirmados=0; doc.getElementById('icsPru').click(); await sleep(150);
  ok('Sin ramos marcados, pregunta antes de agregar toda la jornada', confirmados===1 && (w.__ultimoICS||'').split('BEGIN:VEVENT').length>10);
  /* ═══ Info: Dona y el formulario del Centro ═══ */
  doc.querySelector('.tab[data-tab="info"]').click(); await sleep(250);
  ok('Info: el formulario del Centro (TECH)', visible(doc.getElementById('infoSolic')) && /forms\.office\.com\/r\/FXArxG0RTW/.test(doc.getElementById('infoSolic').innerHTML));
  ok('Dona ya no flota sobre las pantallas', w.getComputedStyle(doc.getElementById('chatFab')).display==='none');
  doc.getElementById('abrirDona').click(); await sleep(200);
  ok('  se abre desde «Pregúntale a Dona» en Info', visible(doc.getElementById('chatPanel')));
  d=abrir("https://miuapp.cl/?derechodiurno",{evaluaciones:[],avisos:[]}); await sleep(1100); doc=d.window.document;
  doc.querySelector('.tab[data-tab="info"]').click(); await sleep(250);
  ok('Diurno: sin formulario del Centro (aún no existe esa vía)', !visible(doc.getElementById('infoSolic')));
  ok('  pero con Dona', !!doc.getElementById('abrirDona'));
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
