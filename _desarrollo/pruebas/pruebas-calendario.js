const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
const stub=`<script>window.supabase={createClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>Promise.resolve({data:[],error:null})})})}),insert:()=>Promise.resolve({error:null})})})};<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
function abrir(url,insc){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){ if(insc)w.localStorage.setItem('insc_sec_v1_2026-T3',JSON.stringify(insc));
    w.scrollTo=()=>{};w.confirm=()=>true;
    w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const cards=doc=>[...doc.querySelectorAll('#pruList .ecard')];
const nombres=doc=>cards(doc).map(c=>c.querySelector('.ehead b').textContent);
const card=(doc,n)=>cards(doc).find(c=>c.querySelector('.ehead b').textContent===n);
const T=c=>c?c.textContent.replace(/\s+/g,' ').trim():'';
async function pru(url,insc,modo){
  const d=abrir(url,insc); await sleep(900); const w=d.window,doc=w.document;
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(300);
  if(modo)w.renderPru(modo); await sleep(150);
  return {d,w,doc};
}
(async()=>{try{
  /* ═══ 1 · La sección se publica ═══ */
  let {w,doc}=await pru("https://miuapp.cl/?derechotech",null,"all");
  ok('TECH: el calendario está publicado', !/todavía no está publicado/.test(doc.getElementById('pruList').textContent));
  ok('Se listan los 24 ramos del PDF ('+cards(doc).length+')', cards(doc).length===24);
  ok('Sale la nota del período con la regla 3,5–3,9', /3,5<\/b> y <b>3,9|3,5 y 3,9/.test(doc.getElementById('pruList').innerHTML));
  ok('Y dice que el examen se califica aprueba o reprueba', /aprueba o reprueba/.test(doc.getElementById('pruList').textContent));
  ok('Los botones de la sección vuelven a verse', doc.querySelector('#pru .horBtns').style.display!=='none');

  /* ═══ 2 · Datos, uno por uno, contra el PDF ═══ */
  const chk=(n,...txt)=>{const c=T(card(doc,n)); ok(n+': '+txt.join(' · '), txt.every(x=>c.includes(x)));};
  chk('Argumentación Jurídica y Debate','vie 9 oct','Semana del 2 nov','No aplica');
  chk('Introducción a la Economía','mar 13 oct','mar 10 nov','mié 9 dic');
  chk('Fundamentos Filosóficos del Derecho','jue 22 oct','jue 19 nov','jue 10 dic');
  chk('Teoría Constitucional','mié 28 oct','mié 25 nov','vie 11 dic');
  chk('Derecho Internacional Público','S1','mar 13 oct','S2','mié 14 oct','mar 3 nov','mié 4 nov','mié 9 dic');
  chk('Bienes','sáb 24 oct','sáb 21 nov','jue 10 dic');
  chk('Derechos y Garantías Constitucionales','jue 29 oct','jue 26 nov','vie 11 dic');
  chk('Taller de Integración I','Semana del 2 al 6 nov','Semana del 30 nov','Por confirmar','Planificación especial');
  chk('Derecho Mercantil','mié 21 oct','mié 11 nov','mié 9 dic');
  chk('Derecho Colectivo del Trabajo y Seg. Social','lun 26 oct','lun 16 nov','jue 10 dic');
  chk('Procedimientos de Ejecución y Cautela','vie 16 oct','mar 24 nov','vie 11 dic','SENA');
  chk('Derecho Tributario I','jue 29 oct','jue 26 nov','mié 9 dic');
  chk('Derecho Administrativo II','lun 19 oct','lun 9 nov','vie 11 dic');
  chk('Optativo de Especialidad I','vie 23 oct','vie 4 dic','vie 11 dic');
  chk('Procedimientos Especiales Orales','mar 13 oct','mar 17 nov','No aplica');
  chk('Taller de Integración II','Semana del 2 al 6 nov','Semana del 30 nov','No aplica');
  chk('Taller de Litigación','jue 22 oct','jue 19 nov','No aplica');
  chk('Derecho Sucesorio','mié 28 oct','mié 25 nov','jue 10 dic');
  chk('Derecho Económico','mié 21 oct','mié 11 nov','mié 9 dic','Plan No Ajustado');
  chk('Derecho Tributario II','jue 29 oct','jue 19 nov','mié 9 dic');
  chk('Optativo de Especialidad II','mié 14 oct','mié 11 nov','jue 10 dic');
  chk('Taller de Litigación Avanzada','lun 19 oct','lun 30 nov','No aplica');
  chk('Teoría del Proceso','mié 21 oct','mié 25 nov','mié 9 dic','alterno');
  const sem=card(doc,'Seminario de Tesis');
  ok('Seminario de Tesis: solo la nota, sin columnas de fechas', sem && !sem.querySelector('.ecols') && /planificación del seminario/.test(T(sem)));
  ok('El orden va por año: primero 1er año, alterno al final',
     nombres(doc)[0]==='Argumentación Jurídica y Debate' && nombres(doc).slice(-1)[0]==='Teoría del Proceso');

  /* ═══ 3 · «Mis ramos»: cada estudiante ve solo los suyos, sin cruzar planes ═══ */
  ({doc}=await pru("https://miuapp.cl/?derechotech",{23:"n6s1",21:"n6s1"},"mine"));
  ok('Plan Ajustado con Bienes y DIP → ve esos dos', nombres(doc).join('|')==='Derecho Internacional Público|Bienes');
  ok('  y de DIP solo la fecha de SU sección (S1)', /mar 13 oct/.test(T(card(doc,'Derecho Internacional Público'))) && !/mié 14 oct/.test(T(card(doc,'Derecho Internacional Público'))));
  ok('  la tarjeta indica su sección', /· S1/.test(T(card(doc,'Derecho Internacional Público'))));

  ({doc}=await pru("https://miuapp.cl/?derechotech",{23:"n6s2"},"mine"));
  ok('  en Sección 2, DIP muestra el miércoles 14 oct', /mié 14 oct/.test(T(card(doc,'Derecho Internacional Público'))) && !/mar 13 oct/.test(T(card(doc,'Derecho Internacional Público'))));

  ({doc}=await pru("https://miuapp.cl/?derechotech",{33:"n9s1"},"mine"));
  ok('COLISIÓN id 33: Plan Ajustado → Derecho Mercantil', nombres(doc).join('|')==='Derecho Mercantil');
  ({doc}=await pru("https://miuapp.cl/?derechotech",{33:"n9pna"},"mine"));
  ok('COLISIÓN id 33: Plan No Ajustado → Derecho Económico (no Mercantil)', nombres(doc).join('|')==='Derecho Económico');

  ({doc}=await pru("https://miuapp.cl/?derechotech",{46:"n12s1"},"mine"));
  ok('COLISIÓN id 46: Plan Ajustado → Derecho Tributario I', nombres(doc).join('|')==='Derecho Tributario I');
  ({doc}=await pru("https://miuapp.cl/?derechotech",{46:"n12pna"},"mine"));
  ok('COLISIÓN id 46: Plan No Ajustado → Taller de Litigación (no Tributario I)', nombres(doc).join('|')==='Taller de Litigación');

  ({doc}=await pru("https://miuapp.cl/?derechotech",{24:"n6s1"},"mine"));
  ok('COLISIÓN id 24: Taller de Integración I (ajustado) no se confunde', nombres(doc).join('|')==='Taller de Integración I');
  ({doc}=await pru("https://miuapp.cl/?derechotech",{24:"n6pna"},"mine"));
  ok('COLISIÓN id 24: el Electivo del No Ajustado no trae fechas ajenas', nombres(doc).length===0);

  ({doc}=await pru("https://miuapp.cl/?derechotech",{34:"n9pna",32:"n9pna",45:"n12pna",43:"n12pna",42:"n12pna",57:"n15pna",54:"n15pna",55:"n15tes"},"mine"));
  ok('Plan No Ajustado con 8 ramos → los 8 (' + nombres(doc).length + ')', nombres(doc).length===8);
  ok('  incluye Tributario II, Optativo II y Seminario del 5º año', ['Derecho Tributario II','Optativo de Especialidad II','Seminario de Tesis'].every(n=>nombres(doc).includes(n)));
  ok('  incluye Proc. Especiales Orales (id distinto en cada plan)', nombres(doc).includes('Procedimientos Especiales Orales'));

  ({doc}=await pru("https://miuapp.cl/?derechotech",{17:"n5alt"},"mine"));
  ok('Alterna: Teoría del Proceso aparece', nombres(doc).join('|')==='Teoría del Proceso');

  /* ═══ 4 · PDF imprimible ═══ */
  let r=await pru("https://miuapp.cl/?derechotech",null,"all");
  r.doc.getElementById('dlPru').click(); await sleep(500);
  let pdf=((r.w.__lastPrint||{}).html||"").replace(/\u00a0/g,' ');
  ok('PDF (24 ramos, versión tabla) se genera', /Calendario de evaluaciones/.test((r.w.__lastPrint||{}).titulo||''));
  ok('  sin el error «Snull» de las fechas sin sección', !/Snull|Sundefined|null P1/.test(pdf));
  ok('  fechas legibles («vie 9 oct»), no «10-09»', /vie 9 oct/.test(pdf) && !/\b\d\d-\d\d\b/.test(pdf.replace(/<style[\s\S]*?<\/style>/g,'').replace(/Generado el [^<]*/g,'')));
  ok('  semanas bien escritas', /Semana del 2 nov/.test(pdf) && /Semana del 2 al 6 nov/.test(pdf));
  ok('  examen «por confirmar» y «no aplica»', /por confirmar/.test(pdf) && /no aplica/.test(pdf));
  ok('  distingue el Plan No Ajustado', /Derecho Económico \(No Ajustado\)/.test(pdf));
  const r2=await pru("https://miuapp.cl/?derechotech",{23:"n6s1",21:"n6s1"},"mine");
  r2.doc.getElementById('dlPru').click(); await sleep(500);
  pdf=((r2.w.__lastPrint||{}).html||"").replace(/\u00a0/g,' ');
  ok('PDF con 2 ramos (versión tarjetas): solo los suyos', /Bienes/.test(pdf) && !/Introducción a la Economía/.test(pdf));
  ok('  y la fecha de su sección', /mar 13 oct/.test(pdf) && !/mié 14 oct/.test(pdf));

  /* ═══ 5 · Las otras jornadas no cambian ═══ */
  { const x=await pru("https://miuapp.cl/?derechodiurno",null,"all");
    ok('Diurno: su calendario de primavera se publica', !/todavía no está publicado/.test(x.doc.getElementById('pruList').textContent) && x.doc.querySelectorAll('#pruList .ecard').length>=35); }
  { const x=await pru("https://miuapp.cl/?derechovespertino",null,null);
    ok('V.Regular: su calendario sigue oculto', /todavía no está publicado/.test(x.doc.getElementById('pruList').textContent)); }
  const x=await pru("https://miuapp.cl/?derechotech",null,null);
  ok('Sin ramos marcados: pide marcar o ver «Todas las pruebas»', /Todas las pruebas|Aún no marcas ramos/.test(x.doc.getElementById('inscBox').textContent));

  console.log(R.join('\n'));
  const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length));
  process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,e.stack);process.exit(2);}})();
