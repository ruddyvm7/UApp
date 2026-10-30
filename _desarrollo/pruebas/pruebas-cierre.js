const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
const stub=`<script>window.supabase={createClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>Promise.resolve({data:[],error:null})})})}),insert:()=>Promise.resolve({error:null})})})};<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
function abrir(url,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){ Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));
    w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const volcar=w=>{const o={};for(let i=0;i<w.localStorage.length;i++){const k=w.localStorage.key(i);o[k]=w.localStorage.getItem(k);}return o;};
async function avance(url,ls){ const d=abrir(url,ls); await sleep(900); const w=d.window,doc=w.document;
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(300); return {w,doc,box:doc.getElementById('cierreBox')}; }
const vis=b=>b&&b.style.display!=='none'&&b.textContent.trim().length>0;
const elegir=(doc,id,v)=>{const b=doc.querySelector(`#cierreBox .ci-op[data-id="${id}"][data-v="${v}"]`); if(b)b.click(); return !!b;};
(async()=>{try{
  /* ═══ TECH: aprobó hasta el nivel 8; el período anterior tenía los tres ramos del 9 ═══ */
  const hecho={}; for(let i=1;i<=31;i++)hecho[i]="ok"; hecho[35]="ok";
  const ARCH=JSON.stringify({"32":"n9s1","33":"n9s1","34":"n9s1"});
  const LS={"malla_derecho_v4":JSON.stringify(hecho),"insc_sec_v1_archivo":ARCH};
  let {w,doc,box}=await avance("https://miuapp.cl/?derechotech",LS);
  ok('TECH: al abrir Avance aparece el cierre de período', vis(box) && /Terminó tu período anterior/.test(box.textContent));
  const nombres=[...box.querySelectorAll('.ci-n')].map(x=>x.firstChild.textContent);
  ok('  con sus 3 ramos del período anterior', nombres.length===3 && nombres.includes('Derecho Mercantil'));
  ok('  y el botón inactivo hasta que responda algo', doc.getElementById('ciGuardar').disabled);
  elegir(doc,33,'ok'); elegir(doc,34,'ok'); elegir(doc,32,'no');
  ok('  al responder, el botón cuenta los ramos (3)', /\(3\)/.test(doc.getElementById('ciGuardar').textContent) && !doc.getElementById('ciGuardar').disabled);
  ok('  la opción elegida queda marcada (accesible)', doc.querySelector('.ci-op[data-id="32"][data-v="no"]').getAttribute('aria-pressed')==='true');
  doc.getElementById('ciGuardar').click(); await sleep(300);
  const S=JSON.parse(w.localStorage.getItem('malla_derecho_v4'));
  ok('  el avance se guarda: 33 y 34 aprobados, 32 reprobado', S["33"]==="ok"&&S["34"]==="ok"&&S["32"]==="no");
  ok('  sin tocar el resto del avance (32 aprobados antes)', Object.keys(S).filter(k=>S[k]==="ok").length===34);
  ok('  la malla se redibuja con el reprobado', !!doc.querySelector('#malla .tile.no[data-id="32"]'));
  ok('  y avisa que se actualizó', /actualizado \(3 ramos\)/.test((doc.getElementById('horToast')||{}).textContent||''));
  ok('  el cuadro se cierra', !vis(box));
  ok('  y el período queda respondido', w.localStorage.getItem('cierre_v1_insc_sec_v1')===ARCH);
  /* al volver otro día: no vuelve a preguntar */
  ({box}=await avance("https://miuapp.cl/?derechotech",volcar(w)));
  ok('TECH: al volver, no pregunta de nuevo por el mismo período', !vis(box));
  /* Horarios ahora parte de datos reales: el reprobado es obligatorio */
  ({w,doc}=await avance("https://miuapp.cl/?derechotech",volcar(w)));
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(350);
  ok('  y Horarios ya ofrece Procedimientos como reprobado obligatorio', /Procedimientos de Ejecución/.test(doc.getElementById('horList').textContent));

  /* ═══ «Ahora no» ═══ */
  ({w,doc,box}=await avance("https://miuapp.cl/?derechotech",LS));
  doc.getElementById('ciLuego').click(); await sleep(100);
  ok('«Ahora no» lo esconde', !vis(box));
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(200); doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  ok('  y no reaparece durante esta visita', !vis(doc.getElementById('cierreBox')));
  ok('  sin marcarlo como respondido', !w.localStorage.getItem('cierre_v1_insc_sec_v1'));
  ({box}=await avance("https://miuapp.cl/?derechotech",LS));
  ok('  en la siguiente visita vuelve a preguntar', vis(box));

  /* ═══ Preselección: si el ramo ya estaba marcado ═══ */
  const pre=Object.assign({},hecho,{"33":"ok"});
  ({doc,box}=await avance("https://miuapp.cl/?derechotech",{"malla_derecho_v4":JSON.stringify(pre),"insc_sec_v1_archivo":ARCH}));
  ok('Si ya había marcado un ramo, viene preseleccionado', doc.querySelector('.ci-op[data-id="33"][data-v="ok"]').classList.contains('on'));

  /* ═══ Sin período anterior ═══ */
  ({box}=await avance("https://miuapp.cl/?derechotech",{}));
  ok('Sin ramos archivados, no aparece nada', !vis(box));

  /* ═══ DIURNO ═══ */
  let x=await avance("https://miuapp.cl/?derechodiurno",{});
  const P=x.w.__mallaSnap(); const c=P.aj.C.filter(z=>z.t===5)[0];
  const AD=JSON.stringify({[c.id]:"aj_n5_sec1"});
  x=await avance("https://miuapp.cl/?derechodiurno",{"insc_sec_diurno_v1_archivo":AD});
  ok('Diurno: aparece el cierre con su ramo ('+c.n+')', vis(x.box) && x.box.textContent.includes(c.n));
  elegir(x.doc,c.id,'ok'); x.doc.getElementById('ciGuardar').click(); await sleep(300);
  const SS=JSON.parse(x.w.localStorage.getItem('malla_sem_diurno_v1')||'{}');
  ok('  y lo guarda en la malla semestral', SS[c.id]==="ok");
  ok('  sin tocar la malla de TECH', !x.w.localStorage.getItem('malla_derecho_v4'));

  console.log(R.join('\n'));
  const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length));
  process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
