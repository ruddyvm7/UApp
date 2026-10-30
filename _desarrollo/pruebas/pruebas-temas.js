/* v2.6 · pantalla de temas, repaso por temas elegidos, registro de respuestas y reportes de error */
const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const precargar=async w=>{ if(w.__estudio&&w.__estudio.cargar) await Promise.all(Object.keys(w.__estudio.indice).map(k=>w.__estudio.cargar(k))); };   /* v2.6.1: el contenido de los mazos se descarga aparte */
const html=fs.readFileSync(process.argv[2]||'trabajo.html','utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,'<script>window.__ins=[];window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(row){window.__ins.push([q._t,row]);return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(t){q._t=t;return q}}}};<\/script>');
function abrir(fecha,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();class F extends Re{constructor(...a){if(a.length)super(...a);else super(f);}static now(){return f;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
(async()=>{try{
  let d=abrir([2026,9,13,10,0]), w=d.window, doc=w.document; await sleep(1100); await precargar(w);
  const app=()=>doc.getElementById('estudioApp'), q=s=>app().querySelector(s), qa=s=>[...app().querySelectorAll(s)];
  const clic=s=>{const b=q(s); if(!b) throw new Error('no se encontró '+s); b.click();};
  const TO=w.__estudio.mazos['teoria-obligaciones'];
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(60); doc.querySelector('#pru [data-ir="estudio"]').click(); await sleep(80);
  clic('[data-es="linea"][data-v="civil"]'); await sleep(40);
  clic('[data-es="abrir"][data-v="bienes"]'); await sleep(40);
  ok('Un ramo sin temas (Bienes) no muestra la entrada «Temas»', !q('.es-temas-entrada') && !!q('[data-es="tarjetas"]'));
  clic('[data-es="ramos"]'); await sleep(40); clic('[data-es="abrir"][data-v="teoria-obligaciones"]'); await sleep(40);
  ok('Teoría de las Obligaciones ofrece «Temas: 12 temas»', /^Temas12 temas: elige cuáles repasar/.test(T(q('.es-temas-entrada'))));
  clic('[data-es="temas"]'); await sleep(40);
  const filas=qa('.es-tfila');
  ok('La pantalla de temas lista los 12 temas en orden, con «‹ Teoría de las Obligaciones» para volver', T(q('h1'))==='Temas' && filas.length===12 && filas.every((b,i)=>T(b.querySelector('b'))===TO.temas[i].t) && T(q('.es-volver'))==='‹ Teoría de las Obligaciones');
  const cuenta=n=>({t:TO.tarjetas.filter(x=>x.u===n).length,p:TO.preguntas.filter(x=>x.u===n).length});
  ok('  cada tema muestra sus tarjetas y preguntas, y su barra', filas.every((b,i)=>{const c=cuenta(i+1); return T(b.querySelector('small'))===`${c.t} tarjetas y ${c.p} preguntas`&&!!b.querySelector('.es-barra');}));
  ok('  sin temas elegidos, los botones están desactivados', /Elige al menos un tema/.test(T(q('.es-tacc'))) && qa('.es-tacc button').every(b=>b.disabled));
  clic('[data-es="temas-todos"]'); await sleep(30);
  ok('  «Elegir todos» marca los 12 y cambia a «Quitar todos»', qa('.es-tfila[aria-pressed="true"]').length===12 && T(q('[data-es="temas-todos"]'))==='Quitar todos');
  clic('[data-es="temas-todos"]'); await sleep(30);
  ok('  «Quitar todos» los desmarca', qa('.es-tfila[aria-pressed="true"]').length===0);
  clic('[data-es="tema"][data-v="7"]'); await sleep(20); clic('[data-es="tema"][data-v="12"]'); await sleep(20);
  const c7=cuenta(7), c12=cuenta(12);
  ok('Con dos temas, el resumen suma '+(c7.t+c12.t)+' tarjetas y '+(c7.p+c12.p)+' preguntas', T(q('.es-tacc p'))===`2 temas elegidos: ${c7.t+c12.t} tarjetas y ${c7.p+c12.p} preguntas` && T(q('[data-es="temas-tarjetas"]'))==='Tarjetas (20)' && T(q('[data-es="temas-preguntas"]'))==='Preguntas (10)');
  clic('[data-es="tema"][data-v="12"]'); await sleep(20);
  ok('  con uno solo, el resumen lo nombra', T(q('.es-tacc p')).startsWith('Solidaridad pasiva: '));
  clic('[data-es="tema"][data-v="12"]'); await sleep(20);
  clic('[data-es="temas-tarjetas"]'); await sleep(40);
  ok('La sesión por temas lo indica arriba', T(q('.es-filtro'))==='2 temas elegidos' && /1 de 20$/.test(T(q('.es-prog'))));
  let fuera=0, vistas=0, idRep=null;
  for(let k=0;k<25;k++){
    const t=q('.es-termino'); if(!t) break; const c=TO.tarjetas.find(x=>x.t===T(t)); vistas++; if(![7,12].includes(c.u)) fuera++;
    clic('.es-btn[data-es="voltear"]'); await sleep(8);
    if(k===0){
      ok('El reverso ofrece «Reportar un error»', T(q('.es-dorso [data-es="reportar"]'))==='Reportar un error');
      clic('[data-es="reportar"]'); await sleep(10);
      const ta=q('#esRepTxt');
      ok('  abre un cuadro de texto con el cursor puesto y la aclaración «Se envía sin tu nombre»', !!ta && doc.activeElement===ta && /Se envía sin tu nombre/.test(T(q('.es-reporte'))));
      clic('[data-es="rep-cancelar"]'); await sleep(10);
      ok('  «Cancelar» lo cierra sin enviar nada', !q('#esRepTxt') && !w.__ins.some(x=>x[0]==='consultas'));
      clic('[data-es="reportar"]'); await sleep(10); q('#esRepTxt').value='El artículo citado no corresponde'; clic('[data-es="rep-enviar"]'); await sleep(10);
      const ins=w.__ins.filter(x=>x[0]==='consultas'), fila=ins[0]&&ins[0][1];
      ok('  «Enviar al CCEE» lo manda sin nombre, con la tarjeta, el ramo y el comentario', ins.length===1 && fila.tema==='error-tarjeta' && fila.respondida===false && fila.pregunta===`Error en ${c.id} (Teoría de las Obligaciones): El artículo citado no corresponde` && !('nombre' in fila));
      ok('  y da las gracias', T(q('.es-rep-ok'))==='Gracias. El CCEE revisará esta tarjeta.');
      idRep=c.id;
    }
    clic(k%5===4?'.es-luz.r':'.es-luz.v'); await sleep(8);
  }
  ok('Las '+vistas+' tarjetas de la sesión son de los temas elegidos', vistas>=20 && fuera===0);
  const E=w.__estudio.estado();
  ok('Cada respuesta queda registrada con fecha, ramo, tarjeta y color ('+E.r.length+')', E.r.length===vistas && E.r.every(x=>x.length===4&&x[0]==='2026-10-13'&&x[1]==='teoria-obligaciones'&&['v','a','r'].includes(x[3])) && E.r.filter(x=>x[3]==='r').length===4);
  ok('  y el reporte queda anotado en el teléfono', E.rep['teoria-obligaciones/'+idRep]==='2026-10-13');
  ok('Al terminar ofrece «Volver a los temas» y selección múltiple', /Volver a los temas/.test(T(q('.es-fin'))) && !!q('.es-botones [data-es="preguntas"]'));
  clic('.es-botones [data-es="preguntas"]'); await sleep(40);
  ok('Las preguntas también se limitan a esos temas', T(q('.es-filtro'))==='2 temas elegidos' && /Pregunta 1 de 10/.test(T(q('.es-prog'))));
  let qf=0, qn=0;
  for(let k=0;k<12;k++){
    const p=q('.es-preg'); if(!p) break; const pr=TO.preguntas.find(x=>x.q===T(p)); qn++; if(![7,12].includes(pr.u)) qf++;
    const ops=qa('.es-op'); (k<2?ops.find(b=>T(b.querySelector('span'))!==pr.o[pr.ok]):ops.find(b=>T(b.querySelector('span'))===pr.o[pr.ok])).click(); await sleep(8);
    if(k===0){
      ok('  la justificación ofrece «Reportar un error»', !!q('.es-por [data-es="reportar"]'));
      q('.es-por [data-es="reportar"]').focus(); doc.querySelector('.es-por [data-es="reportar"]').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true})); await sleep(8);
      ok('  y Enter sobre ese botón no salta a la pregunta siguiente', /Pregunta 1 de 10/.test(T(q('.es-prog'))));
    }
    clic('[data-es="sig"]'); await sleep(8);
  }
  const E2=w.__estudio.estado(), rp=E2.r.filter(x=>x[3]===1||x[3]===0);
  ok('Las '+qn+' preguntas son de los temas elegidos y cada respuesta se registra con 1 o 0', qn===10 && qf===0 && rp.length===10 && rp.filter(x=>x[3]===0).length===2);
  ok('  la ronda por temas no altera el mejor resultado del ramo', !E2.p['teoria-obligaciones'] && E2.p['teoria-obligaciones#temas'].int.length===1 && /8 de 10/.test(T(q('.es-fin'))));
  clic('.es-botones [data-es="preguntas"]'); await sleep(30);
  ok('  «Otra ronda» sigue en los temas elegidos', T(q('.es-filtro'))==='2 temas elegidos');
  clic('.es-prog [data-es="salir"]'); await sleep(30);
  ok('Salir vuelve a la pantalla de temas, con la selección intacta', T(q('h1'))==='Temas' && qa('.es-tfila[aria-pressed="true"]').map(b=>b.dataset.v).join()==='7,12');
  clic('[data-es="ramo"]'); await sleep(30);
  ok('  y desde ahí al ramo, que recuerda «2 temas elegidos de 12»', T(q('h1'))==='Teoría de las Obligaciones' && /2 temas elegidos de 12/.test(T(q('.es-temas-entrada'))));
  clic('[data-es="tarjetas"]'); await sleep(30);
  ok('Las tarjetas del ramo, sin pasar por temas, no llevan filtro: con el cupo de hoy cumplido, «Al día» ofrece 10 nuevas más', !q('.es-filtro') && /para hoy en Teoría de las Obligaciones/.test(T(q('.es-fin'))) && /Estudiar 10 nuevas más/.test(T(q('.es-fin'))) && /Volver al ramo/.test(T(q('.es-fin'))));
  clic('.es-fin [data-es="salir"]'); await sleep(30);
  clic('[data-es="articulos"]'); await sleep(30);
  for(let k=0;k<12&&q('.es-op');k++){ q('.es-op').click(); await sleep(5); clic('[data-es="sig"]'); await sleep(5); }
  ok('Artículos: «Otra ronda» sigue en Artículos', q('.es-botones [data-es="articulos"]')&&T(q('.es-botones [data-es="articulos"]'))==='Otra ronda');
  clic('.es-botones [data-es="salir"]'); await sleep(20);
  doc.querySelector('#estudio [data-ir="estudio"]').click(); await sleep(40);
  ok('Tocar «Estudiar» vuelve a las líneas', !!q('.es-lineas'));
  /* al día siguiente, la tarjeta reportada lo recuerda */
  const ls={'uapp_estudio_v1':w.localStorage.getItem('uapp_estudio_v1')};
  d=abrir([2026,9,14,10,0],ls); w=d.window; doc=w.document; await sleep(1100); await precargar(w);
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(50); doc.querySelector('#pru [data-ir="estudio"]').click(); await sleep(60);
  clic('[data-es="linea"][data-v="civil"]'); await sleep(30); clic('[data-es="abrir"][data-v="teoria-obligaciones"]'); await sleep(30);
  const st=w.__estudio.estado(); st.c['teoria-obligaciones/'+idRep].due='2026-10-14'; /* que salga primera en el repaso */
  Object.keys(st.c).forEach(k=>{ if(k!=='teoria-obligaciones/'+idRep) st.c[k].due='2026-10-20'; });
  clic('[data-es="tarjetas"]'); await sleep(30);
  const prim=TO.tarjetas.find(x=>x.t===T(q('.es-termino')));
  clic('.es-btn[data-es="voltear"]'); await sleep(10);
  ok('Una tarjeta ya reportada dice «Ya reportaste esta tarjeta»', prim.id===idRep && T(q('.es-rep-ya'))==='Ya reportaste esta tarjeta.' && !q('.es-dorso [data-es="reportar"]'));
  /* el registro no crece sin límite */
  const big={c:{},h:{},p:{},n:{},cfg:{},rep:{},r:Array.from({length:4000},(_,i)=>['2026-10-01','bienes','b'+i,'v'])};
  d=abrir([2026,9,14,10,0],{'uapp_estudio_v1':JSON.stringify(big)}); w=d.window; doc=w.document; await sleep(1100); await precargar(w);
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(50); doc.querySelector('#pru [data-ir="estudio"]').click(); await sleep(60);
  clic('[data-es="linea"][data-v="civil"]'); await sleep(30); clic('[data-es="abrir"][data-v="bienes"]'); await sleep(30); clic('[data-es="tarjetas"]'); await sleep(30);
  clic('.es-btn[data-es="voltear"]'); await sleep(10); clic('.es-luz.v'); await sleep(10);
  const r3=w.__estudio.estado().r;
  ok('El registro guarda a lo más las últimas 4.000 respuestas', r3.length===4000 && r3[3999][1]==='bienes' && r3[3999][0]==='2026-10-14' && r3[0][2]==='b1');
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));console.log(R.join('\n'));process.exit(2);}})();
