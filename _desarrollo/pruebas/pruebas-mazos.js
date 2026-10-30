const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const precargar=async w=>{ if(w.__estudio&&w.__estudio.cargar) await Promise.all(Object.keys(w.__estudio.indice).map(k=>w.__estudio.cargar(k))); };   /* v2.6.1: el contenido de los mazos se descarga aparte */
const html=fs.readFileSync(process.argv[2]||'trabajo.html','utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,'<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>');
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
(async()=>{try{
  const d=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://miuapp.cl/?derechotech",beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});
  const w=d.window, doc=w.document; await sleep(1200); await precargar(w);
  const MZ=w.__estudio.mazos, claves=Object.keys(MZ);
  const P=w.__mallaSnap(), C=P[P.cur].C, civiles=C.filter(c=>c.a==='Civil'||c.a==='Procesal').map(c=>c.n);
  ok('Hay '+claves.length+' mazos: los 9 ramos civiles y los 8 procesales', claves.length===17 && claves[0]==='acto-juridico');
  const sinRamo=claves.filter(k=>!civiles.includes(MZ[k].ramo));
  ok('  cada mazo coincide con un ramo civil o procesal de la malla', sinRamo.length===0 && C.filter(c=>c.a==='Civil'||c.a==='Procesal').length===17);
  const ids=[]; let malT=[], malP=[];
  claves.forEach(k=>{ const M=MZ[k];
    M.tarjetas.forEach(t=>{ ids.push(t.id); if(!(t.t&&t.d&&t.d.length>=15&&t.r)) malT.push(k+'/'+t.id); });
    M.preguntas.forEach(q=>{ ids.push(q.id); if(!(q.q&&q.o.length===4&&new Set(q.o).size===4&&q.ok>=0&&q.ok<4&&q.por&&q.por.length>20&&q.r)) malP.push(k+'/'+q.id); });
  });
  const nT=claves.reduce((s,k)=>s+MZ[k].tarjetas.length,0), nP=claves.reduce((s,k)=>s+MZ[k].preguntas.length,0);
  ok('  '+nT+' tarjetas completas (término, definición y fuente)', malT.length===0 && nT===1417);
  ok('  '+nP+' preguntas con 4 alternativas distintas, una correcta, explicación y fuente', malP.length===0 && nP===427);
  ok('  sin identificadores repetidos entre mazos', new Set(ids).size===ids.length);
  ok('  cada ramo nuevo trae 16 tarjetas y 8 preguntas (salvo Teoría y Fuentes, hechos desde los apuntes), y queda «en revisión docente»', claves.slice(1).filter(k=>k!=='fuentes-obligaciones'&&k!=='teoria-obligaciones').every(k=>MZ[k].tarjetas.length===16&&MZ[k].preguntas.length===8&&MZ[k].revision===null));
  const FO=MZ['fuentes-obligaciones'], uT=new Set(FO.tarjetas.map(t=>t.u)), uP=new Set(FO.preguntas.map(q=>q.u)), enClase=x=>[x.t,x.d,x.q,x.por,...(x.o||[])].some(v=>v&&/\ben clases?\b|\bde clase\b/.test(v));
  ok('Fuentes de las Obligaciones: '+FO.tarjetas.length+' tarjetas y '+FO.preguntas.length+' preguntas, ordenadas en '+FO.temas.length+' temas', FO.tarjetas.length===536 && FO.preguntas.length===130 && FO.temas.length===8 && FO.revision===null);
  ok('  cada tarjeta y pregunta pertenece a un tema, y todos los temas tienen tarjetas y preguntas', [...FO.tarjetas,...FO.preguntas].every(x=>Number.isInteger(x.u)&&x.u>=1&&x.u<=8) && uT.size===8 && uP.size===8);
  ok('  los temas van numerados en orden, con nombre, y ningún texto remite a «la clase»', FO.temas.every((c,i)=>c.n===i+1&&c.t) && ![...FO.tarjetas,...FO.preguntas].some(enClase) && !('clases' in FO));
  ok('  la nota no nombra al profesor', !/profesor|docente/i.test(FO.nota));
  const TO=MZ['teoria-obligaciones'];
  ok('Teoría de las Obligaciones: '+TO.tarjetas.length+' tarjetas y '+TO.preguntas.length+' preguntas, ordenadas en '+TO.temas.length+' temas', TO.tarjetas.length===627 && TO.preguntas.length===171 && TO.temas.length===12 && TO.revision===null);
  ok('  cada tarjeta y pregunta pertenece a un tema, y todos los temas tienen tarjetas y preguntas', [...TO.tarjetas,...TO.preguntas].every(x=>Number.isInteger(x.u)&&x.u>=1&&x.u<=12) && TO.temas.every(c=>TO.tarjetas.some(t=>t.u===c.n)&&TO.preguntas.some(q=>q.u===c.n)));
  ok('  temas en orden del curso, del concepto a la prescripción, sin textos que remitan a «la clase»', TO.temas[0].t==='Concepto y fuentes de las obligaciones' && TO.temas.at(-1).t==='Prescripción extintiva' && ![...TO.tarjetas,...TO.preguntas].some(enClase));
  const correctas=[0,1,2,3].map(i=>claves.slice(1).reduce((s,k)=>s+MZ[k].preguntas.filter(q=>q.ok===i).length,0));
  ok('  la alternativa correcta no está siempre en la misma letra (A–D: '+correctas.join(', ')+'); igual se mezclan al jugar', correctas.filter(x=>x>0).length>=3);
  /* ═══ en la app ═══ */
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(80); doc.querySelector('#pru [data-ir="estudio"]').click(); await sleep(150);
  const ea=()=>doc.getElementById('estudioApp');
  ok('Estudiar parte con los botones de línea, sin listas de ramos a la vista', ea().querySelectorAll('.es-lin').length===9 && !ea().querySelector('.es-ramo'));
  ea().querySelector('[data-es="linea"][data-v="civil"]').click(); await sleep(60);
  ok('Línea civil: sus 9 ramos están disponibles, con Teoría y Fuentes de las Obligaciones', ea().querySelectorAll('button.es-ramo').length===9 && !ea().querySelector('.pronto') && !!ea().querySelector('[data-v="teoria-obligaciones"]') && !!ea().querySelector('[data-v="fuentes-obligaciones"]'));
  ea().querySelector('[data-es="lineas"]').click(); await sleep(40); ea().querySelector('[data-es="linea"][data-v="procesal"]').click(); await sleep(60);
  ok('  y los 8 de la línea procesal también', ea().querySelectorAll('button.es-ramo').length===8 && !ea().querySelector('.pronto'));
  /* abre un ramo por su nombre; si no está a la vista, lo busca línea por línea */
  const abrir=async n=>{
    const ver=()=>[...ea().querySelectorAll('button.es-ramo')].find(b=>T(b.querySelector('b'))===n);
    let b=ver();
    if(!b){
      const vl=ea().querySelector('[data-es="lineas"]'); if(vl){ vl.click(); await sleep(30); }
      for(const id of [...ea().querySelectorAll('[data-es="linea"]')].map(x=>x.dataset.v)){
        ea().querySelector('[data-es="linea"][data-v="'+id+'"]').click(); await sleep(30);
        if((b=ver())) break;
        ea().querySelector('[data-es="lineas"]').click(); await sleep(30);
      }
    }
    b.click();
  };
  await abrir('Bienes'); await sleep(80);
  ok('Bienes: ofrece Tarjetas, Selección múltiple y Artículos', !!doc.querySelector('[data-es="tarjetas"]') && !!doc.querySelector('[data-es="preguntas"]') && !!doc.querySelector('[data-es="articulos"]'));
  doc.querySelector('[data-es="articulos"]').click(); await sleep(80);
  ok('  sus Artículos preguntan por el Código Civil', /Código Civil lo establece/.test(T(doc.querySelector('.es-preg'))));
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40); doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Historia y Ev. de las Instituciones Civiles'); await sleep(80);
  ok('Historia (todo doctrina): sin modo Artículos, que no tendría alternativas', !doc.querySelector('[data-es="articulos"]') && !!doc.querySelector('[data-es="tarjetas"]'));
  doc.querySelector('[data-es="tarjetas"]').click(); await sleep(60);
  ok('  sus tarjetas funcionan', !!doc.querySelector('.es-termino'));
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40); doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Recursos'); await sleep(80);
  doc.querySelector('[data-es="articulos"]').click(); await sleep(80);
  ok('Recursos: sus Artículos preguntan por el Código de Procedimiento Civil', /Código de Procedimiento Civil lo establece/.test(T(doc.querySelector('.es-preg'))));
  const MR=MZ['recursos'], cita=T(doc.querySelector('.es-cita')), carta=MR.tarjetas.find(t=>t.d===cita), art='Art. '+carta.r.match(/\d+/)[0];
  [...doc.querySelectorAll('.es-op')].find(b=>T(b.querySelector('span'))===art).click(); await sleep(40);
  const lk=doc.querySelector('.es-por a.es-ref');
  ok('  y su fuente enlaza al Código de Procedimiento Civil en LeyChile (22740)', !!lk && /idNorma=22740$/.test(lk.getAttribute('href')));
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40); doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Reorg. y Liquidación Patrimonial'); await sleep(80);
  ok('Reorganización y Liquidación: sin modo Artículos (cita la Ley 20.720, no un código)', !doc.querySelector('[data-es="articulos"]'));
  doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Derecho Procesal Penal'); await sleep(80); doc.querySelector('[data-es="articulos"]').click(); await sleep(80);
  ok('Procesal Penal: Artículos del Código Procesal Penal', /Código Procesal Penal lo establece/.test(T(doc.querySelector('.es-preg'))));
  /* ═══ Teoría: abre con su nota y muestra el tema ═══ */
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40); doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Teoría de las Obligaciones'); await sleep(80);
  ok('Teoría: abre con su nota sobre los apuntes ordenados por temas', /ordenado por temas/.test(T(doc.querySelector('#estudioApp .lead'))));
  doc.querySelector('[data-es="tarjetas"]').click(); await sleep(80); doc.querySelector('[data-es="voltear"]').click(); await sleep(60);
  const defT=T(doc.querySelector('.es-dorso .es-def')), cT=TO.tarjetas.find(t=>t.d===defT);
  ok('  el reverso muestra el tema «'+T(doc.querySelector('.es-dorso .es-tema'))+'»', !!cT && T(doc.querySelector('.es-dorso .es-tema'))===TO.temas[cT.u-1].t);
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40); doc.querySelector('[data-es="preguntas"]').click(); await sleep(80);
  let etiquetas=0;
  for(let k=0;k<10&&doc.querySelector('.es-preg');k++){
    const qq=TO.preguntas.find(q=>q.q===T(doc.querySelector('.es-preg')));
    doc.querySelector('.es-op').click(); await sleep(30);
    const esperado=TO.temas[qq.u-1].t;
    if(T(doc.querySelector('.es-por .es-tema'))===esperado) etiquetas++;
    doc.querySelector('[data-es="sig"]').click(); await sleep(30);
  }
  ok('  las 10 justificaciones indican su tema', etiquetas===10);
  doc.querySelector('[data-es="salir"]').click(); await sleep(40);
  /* ═══ Fuentes: el tema aparece en la tarjeta, en la justificación y en Artículos ═══ */
  doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Fuentes de las Obligaciones'); await sleep(80);
  ok('Fuentes: abre con su nota sobre los temas y en revisión docente', /ordenado por temas/.test(T(doc.querySelector('#estudioApp .lead'))) && /revisión docente/.test(T(doc.querySelector('#estudioApp .es-rev'))));
  doc.querySelector('[data-es="tarjetas"]').click(); await sleep(80);
  doc.querySelector('[data-es="voltear"]').click(); await sleep(60);
  const defi=T(doc.querySelector('.es-dorso .es-def')), carta1=FO.tarjetas.find(t=>t.d===defi), chip=T(doc.querySelector('.es-dorso .es-tema'));
  ok('  el reverso de la tarjeta muestra el tema «'+chip+'» junto a la fuente', !!carta1 && chip===FO.temas[carta1.u-1].t && !!doc.querySelector('.es-dorso .es-meta .es-ref') && !/Clase/.test(T(doc.querySelector('.es-dorso'))));
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40);
  doc.querySelector('[data-es="preguntas"]').click(); await sleep(80);
  const preg=T(doc.querySelector('.es-preg')), q1=FO.preguntas.find(q=>q.q===preg);
  doc.querySelector('.es-op').click(); await sleep(60);
  ok('  la justificación indica el tema de la pregunta', !!q1 && T(doc.querySelector('.es-por .es-tema'))===FO.temas[q1.u-1].t);
  doc.querySelector('.es-prog [data-es="salir"]').click(); await sleep(40);
  doc.querySelector('[data-es="articulos"]').click(); await sleep(80);
  let revela=0, conClase=0, vistas=0;
  for(let k=0;k<10&&doc.querySelector('.es-cita');k++){
    const cit=T(doc.querySelector('.es-cita')), tj=FO.tarjetas.find(t=>t.d===cit), num=tj&&tj.r.match(/\d+/)[0];
    vistas++; if(!tj||new RegExp('\\b'+num+'\\b').test(cit)) revela++;
    doc.querySelector('.es-op').click(); await sleep(30);
    if(tj && T(doc.querySelector('.es-por .es-tema'))===FO.temas[tj.u-1].t) conClase++;
    doc.querySelector('[data-es="sig"]').click(); await sleep(30);
  }
  ok('  Artículos: '+vistas+' preguntas, ninguna con el número del artículo a la vista, y con su tema', vistas===10 && revela===0 && conClase===vistas);
  doc.querySelector('[data-es="salir"]').click(); await sleep(40);   /* desde la pantalla de resultado */
  doc.querySelector('[data-es="ramos"]').click(); await sleep(60);
  await abrir('Bienes'); await sleep(80); doc.querySelector('[data-es="tarjetas"]').click(); await sleep(80); doc.querySelector('[data-es="voltear"]').click(); await sleep(60);
  ok('  los demás ramos no muestran chip de tema', !doc.querySelector('.es-tema') && !!doc.querySelector('.es-dorso .es-ref'));
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
