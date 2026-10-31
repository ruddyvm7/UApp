const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
const stub=`<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
const TECH={"insc_sec_v1_2026-T3":JSON.stringify({"32":"n9s1","33":"n9s1"})};
function abrir(url,fecha,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,beforeParse(w){
  const Re=w.Date, fijo=new Re(...fecha).getTime();
  class F extends Re{constructor(...a){if(a.length)super(...a);else super(fijo);}static now(){return fijo;}}
  F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));
  w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const vis=el=>el&&el.style.display!=='none';
async function inicio(url,fecha,ls){ const d=abrir(url,fecha,ls); await sleep(1100); return d.window; }
(async()=>{try{
  /* ═══ Navegación y cabecera ═══ */
  let w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,19,40],TECH), doc=w.document;
  const etiquetas=[...doc.querySelectorAll('.tabbar .tab')].map(T);
  ok('Navegación: '+etiquetas.join(' · '), etiquetas.join('|')==='Inicio|Horario|Notas|Avance|Más');
  const secc={hor:'hor',pru:'pru',malla:'malla',info:'info',mural:'mural'}; let todas=true;
  for(const [tab,id] of Object.entries(secc)){ doc.querySelector('.tabbar .tab[data-tab="'+tab+'"]').click(); await sleep(150);
    if(!vis(doc.getElementById(id))||!doc.querySelector('.tabbar .tab[data-tab="'+tab+'"]').classList.contains('active')) todas=false; }
  ok('  cada sección se abre y queda marcada', todas);
  doc.querySelector('.tabbar .tab[data-tab="info"]').click(); await sleep(150); doc.querySelector('.brand2').click(); await sleep(250);
  ok('  el logo vuelve al Inicio', vis(doc.getElementById('mural')));
  ok('Cabecera: el chip muestra la jornada (TECH)', T(doc.getElementById('jornadaChip'))==='TECH');
  doc.getElementById('a11yHead').click(); await sleep(150);
  ok('  el ícono de accesibilidad abre su panel', vis(doc.getElementById('a11yPanel')));
  ok('  el botón flotante ya no se muestra', w.getComputedStyle(doc.getElementById('a11yFab')).display==='none');
  ok('Más: tiene Preferencias (jornada y accesibilidad)', !!doc.getElementById('prefJornada') && !!doc.getElementById('prefA11y') && /Más/.test(T(doc.querySelector('#info .mh'))));
  /* ═══ Inicio: clase en curso ═══ */
  let box=doc.getElementById('inicioBox');
  ok('Martes 19:40: «Esta noche tienes una clase»', /Esta noche tienes una clase/.test(T(box)) && /martes 13 de octubre/.test(T(box)));
  ok('  con asignatura, docente, NRC, modalidad y sala', /Procedimientos de Ejecución y Cautela/.test(T(box)) && /Celedón Baeza Andrés/.test(T(box)) && /11448/.test(T(box)) && /Presencial/.test(T(box)) && /Sala TEA SH-43/.test(T(box)));
  const ancho=parseInt((box.querySelector('.i2-rail i')||{style:{}}).style.width);
  ok('  «En curso» y el riel avanzado ('+ancho+'%)', /En curso/.test(T(box)) && ancho===23);
  box.querySelector('[data-i2="hor"]').click(); await sleep(200);
  ok('  «Ver mi semana» lleva a Horario', vis(doc.getElementById('hor')));
  /* ═══ Tu avance ═══ */
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(200);
  const P=w.__mallaSnap(), M=P[P.cur]; M.C.filter(c=>c.t<=8).forEach(c=>{M.S[c.id]="ok";}); if(P.guardar)P.guardar(); await sleep(150);
  doc.querySelector('.tab[data-tab="mural"]').click(); await sleep(250);
  const av=T(doc.getElementById('avanceMini')), nOk=M.C.filter(c=>c.t<=8).length;
  ok('Tu avance: '+Math.round(nOk/55*100)+' % aprobado, '+nOk+' de 55', new RegExp(Math.round(nOk/55*100)+'\\s% aprobado').test(av) && new RegExp(nOk+' de 55 asignaturas').test(av));
  /* ═══ Otros momentos ═══ */
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,18,0],TECH); box=w.document.getElementById('inicioBox');
  ok('Martes 18:00: la clase aún no empieza (sin «En curso»)', /Esta noche tienes una clase/.test(T(box)) && !/En curso/.test(T(box)) && parseInt(box.querySelector('.i2-rail i').style.width)===0);
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,22,10],TECH); box=w.document.getElementById('inicioBox');
  ok('Martes 22:10: «Tus clases de hoy terminaron» y la próxima', /Tus clases de hoy terminaron/.test(T(box)) && /mañana a las 19:10/.test(T(box)) && /Derecho Mercantil, sala TEA SH-43/.test(T(box)));
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,14,19,0],TECH); box=w.document.getElementById('inicioBox');
  ok('Miércoles: los dos bloques de Mercantil se ven como una clase (19:10 a 22:00)', /Esta noche tienes una clase/.test(T(box)) && /Derecho Mercantil/.test(T(box)) && /19:10/.test(T(box.querySelector('.i2-horas'))) && /22:00/.test(T(box.querySelector('.i2-horas'))));
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,16,12,0],TECH); box=w.document.getElementById('inicioBox');
  ok('Viernes: «Hoy no tienes clases» y la próxima es el martes', /Hoy no tienes clases/.test(T(box)) && /el martes a las 19:10/.test(T(box)));
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,12,19,30],{"insc_sec_v1_2026-T3":JSON.stringify({"32":"n9s1","33":"n9s1","34":"n9s1"})}); box=w.document.getElementById('inicioBox');
  ok('Lunes 12 de octubre: «Hoy es feriado»', /Hoy es feriado/.test(T(box)) && !/i2-noche/.test(box.innerHTML));
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,19,40],{}); box=w.document.getElementById('inicioBox');
  ok('Sin ramos marcados: invita a marcarlos en Horario', /Marca tus ramos en Horario/.test(T(box)) && !!box.querySelector('[data-i2="hor"]'));
  ok('  y Tu avance invita a marcar lo aprobado', /Marca en Avance los ramos que ya aprobaste/.test(T(w.document.getElementById('avanceMini'))));
  /* ═══ Diurno ═══ */
  w=await inicio("https://miuapp.cl/?derechodiurno",[2026,9,15,10,0],{"insc_sec_diurno_v1_2026-S2":JSON.stringify({"22":"aj_n4_sec1","17":"aj_n4_sec1"})}); doc=w.document; box=doc.getElementById('inicioBox');
  ok('Diurno, jueves 10:00: «Hoy tienes 2 clases»', /Hoy tienes 2 clases/.test(T(box)) && box.querySelectorAll('.i2-fila').length===2);
  ok('  en orden, con sala y docente con mayúsculas normales', /9:30.*Derechos y Garantías Constitucionales.*Veloso Angulo Jaime.*12:30.*Teoría del Proceso/.test(T(box)));
  ok('  y el chip dice Diurno', T(doc.getElementById('jornadaChip'))==='Diurno');
  /* ═══ v2.1 ═══ */
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,19,40],TECH); doc=w.document;
  const tit=[...doc.querySelectorAll('#mural .mh')].find(x=>/Mural/.test(x.textContent));
  ok('v2.1 · Inicio: el Mural va antes que Tu avance', !!tit && !!(tit.compareDocumentPosition(doc.getElementById('avanceMini')) & 4));
  ok('v2.1 · el lema ya no aparece en ninguna parte', !/Tu voz, nuestra causa/.test(doc.body.textContent));
  const segs=[...doc.querySelectorAll('#pru .seg2-b')].map(T).join('|');
  ok('v2.1 · el selector dice «Fechas | Calculadora | Estudiar»', segs==='Fechas|Calculadora|Estudiar');
  ok('  y la sección se titula «Calculadora de notas»', /Calculadora de notas/.test(T(doc.querySelector('#calc .h1'))));
  ok('v2.1 · los botones de acción ya no llevan emojis', T(doc.getElementById('toAllPru'))==='Todas las pruebas' && T(doc.getElementById('dlHor'))==='PDF');
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  ok('v2.1 · la sección entra con animación', doc.getElementById('malla').classList.contains('u2-entra'));
  const P2=w.__mallaSnap(), M2=P2[P2.cur]; M2.C.filter(c=>c.t<=8).forEach(c=>{M2.S[c.id]="ok";}); if(P2.guardar)P2.guardar();
  doc.getElementById('malla').click(); await sleep(200);
  const antes=T(doc.getElementById('avanceTop')), n1=+(antes.match(/(\d+) de 55/)||[])[1];
  ok('v2.2 · Avance muestra arriba el porcentaje aprobado', /\d+\s% de tu carrera aprobada/.test(antes) && /te faltan \d+/.test(antes));
  const libre=doc.querySelector('#malla .tile.open'); if(libre) libre.click(); await sleep(250);
  const n2=+(T(doc.getElementById('avanceTop')).match(/(\d+) de 55/)||[])[1];
  ok('  y se actualiza al marcar un ramo ('+n1+' → '+n2+')', !!libre && n2===n1+1);
  ok('v2.1 · la leyenda usa los colores nuevos y minúsculas', /Aprobado/.test(T(doc.querySelector('#malla .legend'))) && /u2-ok/.test(doc.querySelector('#malla .legend').innerHTML));
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(250);
  const pi=doc.querySelector('#pru .pinfo'); if(pi) pi.click(); await sleep(80); const abre=pi&&pi.classList.contains('abierto'); if(pi) pi.click(); await sleep(80);
  ok('v2.1 · Notas: el recuadro del calendario se abre y se cierra', abre && !pi.classList.contains('abierto'));
  doc.body.classList.add('reduce-motion'); doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(150);
  ok('v2.1 · con «Menos movimiento», nada se anima', w.getComputedStyle(doc.querySelector('#hor .wrap > *')).animationName==='none' || /reduce-motion \*/.test(doc.getElementById('uapp2').textContent));
  /* ═══ v2.2 · malla compacta y requisitos a pedido ═══ */
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,19,40],TECH); doc=w.document;
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  const tr=doc.querySelector('#malla .tile .treq'), mm=doc.getElementById('malla'), vr=doc.getElementById('verReq');
  ok('v2.2 · los requisitos están ocultos al entrar', !mm.classList.contains('con-req') && w.getComputedStyle(tr).display==='none' && vr.getAttribute('aria-checked')==='false');
  vr.click(); await sleep(80);
  ok('  «Ver requisitos» los muestra', mm.classList.contains('con-req') && w.getComputedStyle(tr).display!=='none' && vr.getAttribute('aria-checked')==='true');
  ok('  y recuerda la elección', w.localStorage.getItem('uapp_req_v1')==='1');
  const t0=doc.querySelector('#malla .tile.open, #malla .tile.lock');
  ok('v2.2 · al pasar el mouse, el ramo muestra sus requisitos', !!t0 && /Requiere|Sin requisitos/.test(t0.title||''));
  w=await inicio("https://miuapp.cl/?derechotech",[2026,9,13,19,40],Object.assign({},TECH,{"uapp_req_v1":"1"})); doc=w.document;
  ok('  al volver a abrir la app, se mantiene', doc.getElementById('malla').classList.contains('con-req'));
  ok('v2.2 · áreas y respaldo sin mayúsculas ni emojis (v2.8.1: un botón que lleva a Más › Respaldo)', /Derecho Civil/.test(T(doc.querySelector('#malla .areas'))) && T(doc.getElementById('bkIr'))==='Respaldar o pasar a otro teléfono' && !doc.getElementById('bkExp') && !doc.getElementById('bkImp'));
  /* ═══ v2.3 ═══ */
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(200);
  const vr3=doc.getElementById('verReq');
  ok('v2.3 · el interruptor se llama «Prerrequisitos» y está junto al cambio de malla', T(vr3)==='Prerrequisitos' && !!vr3.closest('.mallaSwitch'));
  ok('  y la frase repetida del respaldo ya no está arriba', !doc.querySelector('#malla .boardhint'));
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
