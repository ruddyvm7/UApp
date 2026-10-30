const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const html=fs.readFileSync(process.argv[2]||'trabajo.html','utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,'<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>');
function abrir(url){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
(async()=>{try{
  let d=abrir("https://miuapp.cl/?derechotech"), w=d.window, doc=w.document; await sleep(1200);
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  const A=()=>{const P=w.__mallaSnap(); return P[P.cur];};
  const C=A().C, pre=c=>{ if(c.p&&c.p.upTo){ const t=C.find(x=>x.id===c.p.upTo).t; return C.filter(x=>x.t<=t&&x.id!==c.id).map(x=>x.id); } return w.Array.isArray(c.p)?[...c.p]:[]; };
  const bienes=C.find(c=>c.n==="Bienes"), des=C.filter(c=>pre(c).includes(bienes.id)).map(c=>c.id);
  const tile=id=>doc.querySelector('#years .tile[data-id="'+id+'"]');
  const ev=(el,tipo)=>el.dispatchEvent(new w.MouseEvent(tipo,{bubbles:true,cancelable:true,button:0,clientX:20,clientY:20}));
  /* ═══ 1 · mantener presionado ═══ */
  ev(tile(bienes.id),'pointerdown'); await sleep(520);
  const Y=doc.getElementById('years');
  ok('Mantener presionado «Bienes» activa la vista de conexiones', Y.classList.contains('mv-foco') && tile(bienes.id).classList.contains('mv-este'));
  ok('  sus prerrequisitos ('+bienes.p.length+') quedan destacados', bienes.p.every(id=>tile(id).classList.contains('mv-req')));
  ok('  y lo que desbloquea ('+des.length+')', des.length>0 && des.every(id=>tile(id).classList.contains('mv-des')));
  const nomReq=bienes.p.map(id=>C.find(c=>c.id===id).n);
  ok('  el aviso nombra lo que exige y lo que desbloquea', nomReq.every(n=>T(doc.getElementById('mvBanner')).includes(n)) && /Desbloquea:/.test(T(doc.getElementById('mvBanner'))));
  const antes=A().S[bienes.id];
  ev(tile(bienes.id),'pointerup'); tile(bienes.id).click(); await sleep(150);
  ok('  al soltar, el ramo NO cambia de estado', A().S[bienes.id]===antes && Y.classList.contains('mv-foco'));
  const otro=C.find(c=>c.t===1); const antesOtro=A().S[otro.id];
  tile(otro.id).click(); await sleep(150);
  ok('  tocar otro ramo cierra la vista sin marcarlo', !Y.classList.contains('mv-foco') && A().S[otro.id]===antesOtro);
  tile(bienes.id).dispatchEvent(new w.MouseEvent('contextmenu',{bubbles:true,cancelable:true})); await sleep(60);
  ok('  clic derecho (computador) también la abre', Y.classList.contains('mv-foco'));
  doc.querySelector('.mv-b-cerrar').click(); await sleep(60);
  ok('  y «Listo» la cierra', !Y.classList.contains('mv-foco') && !doc.getElementById('mvBanner').classList.contains('ver'));
  const sem=C.find(c=>c.p&&c.p.upTo);
  ev(tile(sem.id),'pointerdown'); await sleep(520);
  ok('  un ramo que exige todo un tramo ('+sem.n+') lo explica sin listar decenas de ramos', /Requiere: todos los ramos hasta .+\(nivel \d+\)/.test(T(doc.getElementById('mvBanner'))) && doc.querySelectorAll('#years .tile.mv-req').length===pre(sem).length);
  doc.querySelector('.mv-b-cerrar').click(); await sleep(60);
  /* ═══ 2 · celebración al completar un año ═══ */
  const lv1=[...doc.querySelectorAll('#years .lvl')].filter(l=>T(l.querySelector('.lvl-eyebrow'))==='Año 1');
  const ids1=[].concat(...lv1.map(l=>[...l.querySelectorAll('.tile')].map(t=>+t.getAttribute('data-id'))));
  const P=w.__mallaSnap(), M=P[P.cur]; ids1.slice(0,-1).forEach(id=>{M.S[id]='ok';}); if(P.guardar)P.guardar();
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(80); doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  const ultimo=ids1[ids1.length-1]; tile(ultimo).click(); await sleep(300);
  ok('Al marcar el último ramo del año 1, celebra: «'+T(doc.getElementById('horToast')).slice(0,45)+'»', A().S[ultimo]==='ok' && /Completaste el Año 1/.test(T(doc.getElementById('horToast'))));
  /* ═══ 3 · PDF de la malla ═══ */
  ok('Avance tiene «Descargar PDF» junto a Prerrequisitos', T(doc.getElementById('mallaPdf'))==='Descargar PDF' && !!doc.getElementById('mallaPdf').closest('.mallaSwitch'));
  doc.getElementById('mallaPdf').click(); await sleep(150);
  const pdf=w.__mallaPdfHTML||'';
  ok('  el PDF trae el porcentaje, el plan y la jornada', /Avance curricular/.test(pdf) && /\d+ %/.test(pdf) && /Plan Ajustado/.test(pdf) && /Vespertina TECH/.test(pdf));
  ok('  los 55 ramos con su estado, por nivel', (pdf.match(/<tr><td>/g)||[]).length===55 && (pdf.match(/class="niv"/g)||[]).length===14 && /Aprobado/.test(pdf) && /Pendiente|Bloqueado/.test(pdf));
  ok('  y aclara que no es un certificado oficial', /No es un certificado oficial/.test(pdf));
  /* ═══ 4 · Estudiar: modo Artículos ═══ */
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(80); doc.querySelector('#pru [data-ir="estudio"]').click(); await sleep(120);
  doc.querySelector('[data-es="linea"][data-v="civil"]').click(); await sleep(60);
  doc.querySelector('[data-es="abrir"][data-v="acto-juridico"]').click(); await sleep(80);
  ok('Estudiar ofrece un tercer modo: «Artículos»', !!doc.querySelector('[data-es="articulos"]') && /Artículos/.test(T(doc.querySelector('[data-es="articulos"]'))));
  doc.querySelector('[data-es="articulos"]').click(); await sleep(80);
  const app=()=>doc.getElementById('estudioApp'), MZ=w.__estudio.mazos['acto-juridico'];
  const ops=[...app().querySelectorAll('.es-op span')].map(T), nums=ops.map(o=>+o.replace(/\D/g,''));
  ok('  muestra la regla y 4 artículos en orden numérico', !!app().querySelector('.es-cita') && ops.length===4 && ops.every(o=>/^Art\. \d+$/.test(o)) && nums.join()===nums.slice().sort((a,b)=>a-b).join());
  let aciertos=0;
  for(let k=0;k<10;k++){
    const cita=T(app().querySelector('.es-cita')), card=MZ.tarjetas.find(t=>t.d===cita), art='Art. '+card.r.match(/\d+/)[0];
    const btns=[...app().querySelectorAll('.es-op')], bien=btns.find(b=>T(b.querySelector('span'))===art);
    (k<8?bien:btns.find(b=>b!==bien)).click(); await sleep(25);
    if(k===0) ok('  al acertar: «Correcto» y enlace al artículo en LeyChile', /Correcto/.test(T(app().querySelector('.es-por'))) && !!app().querySelector('.es-por a.es-ref[href*="leychile"]'));
    if(k<8) aciertos++;
    app().querySelector('.es-btn[data-es="sig"]').click(); await sleep(25);
  }
  ok('  resultado 8 de 10 y «Otra ronda» repite el modo Artículos', /8 de 10/.test(T(app())) && !!app().querySelector('.es-botones [data-es="articulos"]'));
  app().querySelector('.es-botones [data-es="salir"]').click(); await sleep(60);
  ok('  las estadísticas del ramo suman la ronda de Artículos', /Artículos 1 ronda, mejor: 8 de 10/.test(T(app())));
  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
