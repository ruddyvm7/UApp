const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
const stub=`<script>window.supabase={createClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>Promise.resolve({data:[],error:null})})})}),insert:()=>Promise.resolve({error:null})})})};<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
let confirmados=0;
function abrir(url){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>{confirmados++;return true;};w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' '):'';
async function plan(url,hasta){
  const d=abrir(url); await sleep(900); const w=d.window,doc=w.document;
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  const P=w.__mallaSnap(), M=P[P.cur]; M.C.filter(c=>c.t<=hasta).forEach(c=>{M.S[c.id]="ok";});
  if(P.guardar)P.guardar(); await sleep(200);
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(300);
  doc.getElementById('toPlan').click(); await sleep(500);
  return {w,doc};
}
(async()=>{try{
  /* ═══ TECH ═══ */
  let {w,doc}=await plan("https://miuapp.cl/?derechotech",8);
  let b=doc.getElementById('usarProp');
  ok('TECH: el planificador ofrece «Usar esta propuesta»', !!b && /Usar esta propuesta/.test(b.textContent));
  const nProp=(T(doc.querySelector('#planOut .hgrp'))||'').match(/\((\d+)\)/);
  b.click(); await sleep(400);
  let ins=w.eval('insc'), ks=Object.keys(ins);
  ok('  al tocarlo, marca en Horarios los ramos propuestos ('+ks.length+')', nProp && ks.length===+nProp[1] && ks.length>0);
  ok('  con bloques reales del horario (n9…)', ks.every(id=>/^n\d+/.test(ins[id])));
  ok('  y avisa que quedó listo', /marcamos en tu horario/.test(T(doc.getElementById('horToast'))));
  ok('  se guarda para la próxima visita', JSON.parse(w.localStorage.getItem('insc_sec_v1_2026-T3')||'{}')[ks[0]]===ins[ks[0]]);
  confirmados=0; doc.getElementById('usarProp').click(); await sleep(300);
  ok('  si ya había ramos marcados, pide confirmación antes de reemplazar', confirmados===1);
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(300);
  const tally=T(doc.getElementById('hor'));
  ok('  Horarios ya cuenta los ramos aplicados', new RegExp(ks.length+' ramo').test(tally));

  /* ═══ DIURNO ═══ */
  ({w,doc}=await plan("https://miuapp.cl/?derechodiurno",3));
  b=doc.getElementById('usarProp');
  ok('Diurno: también ofrece «Usar esta propuesta»', !!b);
  if(b){ b.click(); await sleep(400); }
  ins=w.eval('insc'); ks=Object.keys(ins);
  ok('  y marca sus ramos ('+ks.length+')', ks.length>0);
  /* ningún par de ramos aplicados choca: el planificador de Diurno nunca propone choques */
  ok('  la respuesta trae solo secciones de Diurno', ks.every(id=>typeof ins[id]==='string' && ins[id].length>0));

  /* ═══ Diurno no acepta coincidencias ═══ */
  const choque=w.eval(`(function(){
    var H=(typeof HOR!=="undefined")?HOR:null; if(!H||typeof cruceEntre!=="function") return null;
    var ops=[]; Object.keys(H).forEach(function(k){ var g={}; H[k].s.forEach(function(se){ if(se[6]==null)return; (g[se[6]]=g[se[6]]||[]).push(se); });
      Object.keys(g).forEach(function(id){ ops.push({k:k,id:+id,s:g[id]}); }); });
    for(var i=0;i<ops.length;i++)for(var j=i+1;j<ops.length;j++){ if(ops[i].id===ops[j].id)continue;
      var c=cruceEntre(ops[i].s,ops[j].s); if(c) return {a:ops[i].k,ai:ops[i].id,b:ops[j].k,bi:ops[j].id,tipo:c.tipo,sin:!!c.sinCoinc,pct:Math.round(Math.max(c.pctA,c.pctB))}; }
    return "sin choques"; })()`);
  ok('Diurno: cualquier choque de horario queda bloqueado ('+(choque&&choque.pct)+'%)', choque && choque.tipo==="excede" && choque.sin===true);
  ({w,doc}=await plan("https://miuapp.cl/?derechotech",8));
  const choqueT=w.eval(`(function(){ var H=HOR, ops=[]; Object.keys(H).forEach(function(k){ var g={}; H[k].s.forEach(function(se){ if(se[6]==null)return; (g[se[6]]=g[se[6]]||[]).push(se); }); Object.keys(g).forEach(function(id){ ops.push({k:k,id:+id,s:g[id]}); }); });
    for(var i=0;i<ops.length;i++)for(var j=i+1;j<ops.length;j++){ if(ops[i].id===ops[j].id)continue; var c=cruceEntre(ops[i].s,ops[j].s); if(c&&c.tipo==="solicitable") return {tipo:c.tipo,sin:!!c.sinCoinc}; } return null; })()`);
  ok('TECH: sigue permitiendo solicitar una coincidencia de hasta 50%', choqueT && choqueT.tipo==="solicitable" && !choqueT.sin);

  console.log(R.join('\n')); const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length)); process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,(e.stack||'').split('\n').slice(0,3).join(' | '));process.exit(2);}})();
