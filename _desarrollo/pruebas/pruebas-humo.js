const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync('trabajo.html','utf8');
const stub=`<script>window.supabase={createClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>Promise.resolve({data:[],error:null})})})}),insert:()=>Promise.resolve({error:null})})})};<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
function abrir(url){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.open=u=>{w.__ab=u;};
    w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
(async()=>{try{
  for(const [j,u] of [["TECH","?derechotech"],["Diurno","?derechodiurno"],["V.Regular","?derechovespertino"]]){
    const d=abrir("https://miuapp.cl/"+u); await sleep(900);
    const doc=d.window.document;
    const errs=[]; 
    for(const t of ["mural","malla","hor","pru","calc","info"]){
      const b=doc.querySelector('.tab[data-tab="'+t+'"]'); if(!b)continue;
      try{ b.click(); await sleep(160); }catch(e){ errs.push(t+": "+e.message); }
    }
    ok(j+": todas las pestañas abren sin error", !errs.length);
    const h=doc.getElementById('horList');
    ok(j+": horarios con contenido", h && h.textContent.length>100);
  }
  /* el flujo TECH completo */
  const d=abrir("https://miuapp.cl/?derechotech"); await sleep(900);
  const w=d.window, doc=w.document;
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(200);
  const P=w.__mallaSnap(); P.aj.C.filter(c=>c.t<=8).forEach(c=>{P.aj.S[c.id]="ok";});
  const tl=[...doc.querySelectorAll('#malla .tile')]; tl[tl.length-1].click(); tl[tl.length-1].click();
  await sleep(300);
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(320);
  const niv=[...new Set([...doc.querySelectorAll('#horList td.selc')].map(t=>(t.dataset.key.match(/n(\d+)/)||[])[1]))];
  ok('Alumno al día en 9 ve solo el nivel 9 ('+niv.join(",")+')', niv.length===1&&niv[0]==='9');
  [...doc.querySelectorAll('#horList td.selc')].slice(0,1).forEach(c=>c.click()); await sleep(280);
  doc.getElementById('toPlan').click(); await sleep(400);
  ok('Planificador propone', /Ramos propuestos/.test(doc.getElementById('planOut').textContent));
  doc.getElementById('dlPlan').click(); await sleep(500);
  ok('Genera el respaldo PDF', !!w.__lastPrint);
  w.SOLICITUD.desde=""; w.SOLICITUD.hasta="";
  doc.getElementById('toPlan').click(); await sleep(350);
  const b=doc.getElementById('btnSolic');
  ok('Botón de solicitud presente', !!b);
  if(b){ b.click(); await sleep(300); }
  ok('Abre el formulario oficial prellenado', /977P_dy_581Asij/.test(w.__ab||"") && /r(6e1b|c0ce|f345)/.test(w.__ab||""));
  ok('Con el resumen de una línea', /Validado%20por%20UApp/.test(w.__ab||""));
  console.log(R.join('\n'));
  const f=R.filter(x=>x[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length));
  process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message);}})();
