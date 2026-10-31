const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
/* Supabase simulado: filtra por eq/gte como el real */
const stub=`<script>(function(){
  function Q(t){this.t=t;this.f=[];}
  Q.prototype.select=function(){return this;}; Q.prototype.order=function(){return this;};
  Q.prototype.eq=function(k,v){this.f.push(function(r){return r[k]===v;});return this;};
  Q.prototype.gte=function(k,v){this.f.push(function(r){return String(r[k])>=String(v);});return this;};
  Q.prototype.insert=function(){return Promise.resolve({error:null});};
  Q.prototype.then=function(ok,ko){var T=(window.__TABLAS||{})[this.t],self=this;
    if(T==="error")return Promise.resolve({data:null,error:{message:"sin conexión"}}).then(ok,ko);
    return Promise.resolve({data:(T||[]).filter(function(r){return self.f.every(function(fn){return fn(r);});}),error:null}).then(ok,ko);};
  window.supabase={createClient:function(){return {from:function(t){return new Q(t);}};}};
})();<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
/* v2.8.1 · fecha fija (30 de octubre de 2026): antes la prueba dependía del día en que se corría */
const HOY=new Date(2026,9,30,10,0);
const dia=n=>{const d=new Date(HOY);d.setHours(0,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function abrir(url,tablas,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){ const Re=w.Date,fx=HOY.getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(fx);}static now(){return fx;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
    w.__TABLAS=tablas; Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));
    w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' '):'';
const vis=b=>b&&b.style.display!=='none'&&b.textContent.trim().length>0;
const DIURNO=[
 {jornada:'diurno',fecha:dia(1),asignatura:'Derecho Político',seccion:'',hora:'08:00',modalidad:'escrita',sala:'A-42',docente:'Gabriela Silva P.'},
 {jornada:'diurno',fecha:dia(1),asignatura:'Teoría de la Reacción Penal',seccion:'S1',hora:'08:30',modalidad:'oral',sala:'A-52',docente:'Julio Grandón C.'},
 {jornada:'diurno',fecha:dia(1),asignatura:'Teoría de la Reacción Penal',seccion:'S2',hora:'09:30',modalidad:'escrita',sala:'A-42',docente:'Camila Fernández R.'},
 {jornada:'diurno',fecha:dia(3),asignatura:'Recursos',seccion:'',hora:'09:00',modalidad:'oral',sala:'A-31',docente:'Manuel Contreras L.'},
 {jornada:'diurno',fecha:dia(12),asignatura:'Bienes',seccion:'S1',hora:'08:00',modalidad:'oral',sala:'A-31',docente:'X'},
 {jornada:'tech',fecha:dia(1),asignatura:'Derecho Mercantil',seccion:'S1',hora:'19:10',modalidad:'presencial',sala:'TEA SH-43',docente:'Jean Paul Thiers Thiers'},
 {jornada:'tech',fecha:dia(1),asignatura:'Derecho Mercantil',seccion:'S2',hora:'19:10',modalidad:'presencial',sala:'TEA SH-44',docente:'Otro'},
 {jornada:'tech',fecha:dia(2),asignatura:'Derecho Sucesorio',seccion:'',hora:'19:10',modalidad:'escrita',sala:'A-42',docente:'Marco San Juan T.'}];
(async()=>{try{
  /* ═══ Diurno, sin ramos marcados ═══ */
  let d=abrir("https://miuapp.cl/?derechodiurno",{evaluaciones:DIURNO,avisos:[]}); await sleep(1200);
  let w=d.window, doc=w.document, box=doc.getElementById('semanaBox');
  { const tit=[...doc.querySelectorAll('#mural .mh')].find(x=>/Mural/.test(x.textContent));
    ok('«Esta semana» aparece antes que el Mural', vis(box) && tit && !!(box.compareDocumentPosition(tit) & 4)); }
  ok('  sin ramos marcados: todas las de la jornada', /Evaluaciones de tu jornada/.test(T(box)) && /Marca tus ramos en Horarios/.test(T(box)));
  ok('  «Mañana» con hora, modalidad, sala y docente', /Mañana/.test(T(box)) && /Derecho Político/.test(T(box)) && /08:00 · escrita · sala A-42 · Gabriela Silva P\./.test(T(box)));
  /* busca el ramo dentro del día indicado (el calendario real puede traer el mismo ramo otro día) */
  const enDia=(dia,n)=>{ let d='',hit=null; [...box.children].forEach(x=>{ if(x.classList.contains('sem-dia')) d=T(x).trim(); else if(!hit&&d===dia&&x.classList.contains('sem-it')&&T(x.querySelector('.sem-n')).trim()===n) hit=x; }); return hit; };
  const rp=enDia('Mañana','Teoría de la Reacción Penal'), lin=rp?[...rp.querySelectorAll('.sem-d')].map(T):[];
  ok('  Reacción Penal una sola vez, con una línea por sección', lin.length===2 && /^S1 · 08:30 · oral · sala A-52/.test(lin[0]) && /^S2 · 09:30 · escrita · sala A-42/.test(lin[1]));
  ok('  ramos ordenados por su primera hora', T(box).indexOf('Derecho Político')<T(box).indexOf('Teoría de la Reacción Penal'));
  ok('  solo los próximos 7 días (Bienes, en 12 días, no sale)', /Recursos/.test(T(box)) && !/Bienes/.test(T(box)));
  ok('  nada de otra jornada (las de TECH de la prueba no aparecen; el calendario oficial de Diurno sí puede traer «Mercantil»)', !/TEA SH-4|San Juan/.test(T(box)));
  ok('Guarda una copia para usar sin conexión', JSON.parse(w.localStorage.getItem('evdet_v1_diurno')||'[]').length===5);
  /* ═══ Sin conexión: usa la copia ═══ */
  d=abrir("https://miuapp.cl/?derechodiurno",{evaluaciones:"error",avisos:[]},{"evdet_v1_diurno":JSON.stringify(DIURNO.filter(r=>r.jornada==='diurno'))}); await sleep(1200);
  box=d.window.document.getElementById('semanaBox');
  ok('Sin conexión, muestra la última copia guardada', vis(box) && /Derecho Político/.test(T(box)) && /sala A-42/.test(T(box)));
  /* ═══ TECH con Derecho Mercantil, sección 1 ═══ */
  d=abrir("https://miuapp.cl/?derechotech",{evaluaciones:DIURNO,avisos:[]},{"insc_sec_v1_2026-T3":JSON.stringify({"33":"n9s1"})}); await sleep(1200);
  w=d.window; doc=w.document; box=doc.getElementById('semanaBox');
  ok('TECH con ramos marcados: «Tus evaluaciones»', vis(box) && /Tus evaluaciones/.test(T(box)) && !/Marca tus ramos/.test(T(box)));
  ok('  muestra su sección (S1, sala TEA SH-43)', /Derecho Mercantil/.test(T(box)) && /S1 · 19:10 · presencial · sala TEA SH-43/.test(T(box)));
  ok('  no la sección ajena (S2) ni ramos que no cursa', !/TEA SH-44/.test(T(box)) && !/Sucesorio/.test(T(box)));
  /* tarjetas de Pruebas */
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(400);
  const card=[...doc.querySelectorAll('#pruList .ecard')].find(c=>/Derecho Mercantil/.test(T(c.querySelector('.ehead b'))));
  const det=card&&card.querySelector('.edet');
  ok('Pruebas: la tarjeta de Mercantil trae hora y sala de su sección', !!det && /Mañana/.test(T(det)) && /19:10/.test(T(det)) && /TEA SH-43/.test(T(det)));
  ok('  sin la sección ajena', det && !/TEA SH-44/.test(T(det)));
  w.renderPru('all'); await sleep(200);
  const c2=[...doc.querySelectorAll('#pruList .ecard')].find(c=>/Derecho Mercantil/.test(T(c.querySelector('.ehead b'))));
  ok('  también al cambiar a «Todas las pruebas»', c2 && c2.querySelector('.edet') && c2.querySelectorAll('.edet').length===1);
  /* evaluación del calendario sin detalle todavía */
  w.__pruDatos=()=>({REG:'tri',EVALS:[{asig:'Derecho Mercantil',p1:[[dia(4).slice(5),null]],p2:[],fin:null}]});
  w.__evSemana.pintar(); await sleep(50);
  ok('Del calendario, sin detalle aún: «se publican la semana anterior»', /1ª prueba\. La hora y la sala se publican la semana anterior/.test(T(box)));
  w.__pruDatos=()=>({REG:'tri',EVALS:[{asig:'Derecho Mercantil',p1:[[dia(1).slice(5),null]],p2:[],fin:null}]});
  w.__evSemana.pintar(); await sleep(50);
  ok('  y si ya hay detalle publicado, no se repite', (T(box).match(/Derecho Mercantil/g)||[]).length===1);
  /* nada esta semana */
  d=abrir("https://miuapp.cl/?derechotech",{evaluaciones:[],avisos:[]}); await sleep(1100);
  d.window.__pruDatos=()=>({REG:'tri',EVALS:[]}); d.window.__evSemana.pintar();
  ok('Sin evaluaciones en la semana, no ocupa espacio', !vis(d.window.document.getElementById('semanaBox')));
  /* ═══ El mismo ramo escrito de distintas formas ═══ */
  const m=w.__mismoRamo;
  ok('Nombres: «Fuente de las Obligaciones» = «Fuentes de las Obligaciones»', m('Fuente de las Obligaciones','Fuentes de las Obligaciones'));
  ok('  «Fundamentos Filosoficos del D°» = «Fundamentos Filosóficos del Derecho»', m('Fundamentos Filosoficos del D°','Fundamentos Filosóficos del Derecho'));
  ok('  «Reorganización y Liquidación» = «Reorg. y Liquidación Patrimonial»', m('Reorganización y Liquidación','Reorg. y Liquidación Patrimonial'));
  ok('  «Derecho Colectivo del Trabajo» = «… y Seg. Social»', m('Derecho Colectivo del Trabajo','Derecho Colectivo del Trabajo y Seg. Social'));
  ok('  «Optativo Especialidad II» = «Optativo de Especialidad II»', m('Optativo Especialidad II','Optativo de Especialidad II'));
  ok('  pero «Administrativo I» ≠ «Administrativo II»', !m('Derecho Administrativo I','Derecho Administrativo II'));
  ok('  «Taller de Litigación» ≠ «Taller de Litigación Avanzada»', !m('Taller de Litigación','Taller de Litigación Avanzada'));
  ok('  «Historia del Derecho» ≠ «Historia Institucional de Chile»', !m('Historia del Derecho','Historia Institucional de Chile'));
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
