const fs=require('fs');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const base=fs.readFileSync(process.argv[2]||'trabajo.html','utf8');
const stub=`<script>window.supabase={createClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({order:()=>Promise.resolve({data:[],error:null})})})}),insert:()=>Promise.resolve({error:null})})})};<\/script>`;
const html=base.replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,stub);
function abrir(url){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url,
  beforeParse(w){w.scrollTo=()=>{};w.confirm=()=>true;w.open=u=>{w.__ab=u;};
    w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' '):'';
async function preparar(url,niveles){
  const d=abrir(url); await sleep(900); const w=d.window,doc=w.document;
  doc.querySelector('.tab[data-tab="malla"]').click(); await sleep(250);
  if(niveles){ const P=w.__mallaSnap(); const M=P[P.cur]; M.C.filter(c=>c.t<=niveles).forEach(c=>{M.S[c.id]="ok";});
    const tl=[...doc.querySelectorAll('#malla .tile')]; if(tl.length){tl[tl.length-1].click();tl[tl.length-1].click();} await sleep(250); }
  doc.querySelector('.tab[data-tab="hor"]').click(); await sleep(350);
  return {d,w,doc};
}
(async()=>{try{
  /* ═══ DIURNO ═══ */
  let {w,doc}=await preparar("https://miuapp.cl/?derechodiurno",null);
  doc.querySelector('.tab[data-tab="pru"]').click(); await sleep(300); w.renderPru('all'); await sleep(200);
  const tarjetas=doc.querySelectorAll('#pruList .ecard').length;
  ok('Diurno: el calendario de pruebas se publica ('+tarjetas+' asignaturas)', tarjetas>=35 && !/todavía no está publicado/.test(T(doc.getElementById('pruList'))));
  ok('Diurno: con la nota oficial de primavera 2026', /Calendario oficial de la Carrera, primavera 2026/.test(T(doc.getElementById('pruList'))));
  ({w,doc}=await preparar("https://miuapp.cl/?derechodiurno",null));
  const cel=doc.querySelector('#horList td.selc'); if(cel){cel.click(); await sleep(300);}
  ok('Diurno: puede inscribir un ramo', Object.keys(w.eval('insc')).length>=1);
  w.SOLICITUD.desde=""; w.SOLICITUD.hasta="";
  doc.getElementById('toPlan').click(); await sleep(450);
  ok('Diurno: NO ve la solicitud de toma de carga de TECH', !doc.getElementById('btnSolic') && (doc.getElementById('solicBox').style.display==='none'));
  const lc=doc.getElementById('lnkCirc');
  ok('Diurno: no muestra enlace a ninguna circular (se rige por el Reglamento)', lc && lc.style.display==='none');
  ok('  y el planificador dice que no se autorizan coincidencias', /no se autorizan/.test(T(doc.getElementById('plan'))) && !/ciclo avanzado/.test(T(doc.getElementById('plan'))));
  ok('Diurno: el planificador no cita ninguna circular', !/Circular N°0\d\/2026/.test(T(doc.getElementById('plan'))));
  doc.getElementById('dlPlan').click(); await sleep(500);
  let pdf=(w.__lastPrint||{}).html||'';
  ok('Diurno: el respaldo PDF cita el Reglamento (art. 17 letras a y b)', /art\. 17 letra a/.test(pdf) && /art\. 17 letra b/.test(pdf) && /Reglamento General del Estudiante de Pregrado/.test(pdf));
  ok('  y ninguna circular', !/Circular N°0\d\/2026/.test(pdf));

  /* ═══ TECH ═══ */
  ({w,doc}=await preparar("https://miuapp.cl/?derechotech",8));
  const c9=[...doc.querySelectorAll('#horList td.selc')][0]; if(c9){c9.click(); await sleep(300);}
  w.SOLICITUD.desde=""; w.SOLICITUD.hasta="";
  doc.getElementById('toPlan').click(); await sleep(450);
  ok('TECH: sigue viendo la solicitud de toma de carga', !!doc.getElementById('btnSolic'));
  const lt=doc.getElementById('lnkCirc'); lt.click(); await sleep(150);
  ok('TECH: el enlace «Circular N°05/2026» abre la 05/2026 (antes abría la 03)', /05\/2026/.test(lt.textContent) && /Tercer trimestre TECH/.test(T(doc.getElementById('docTitle'))));
  ok('TECH: el planificador ya no muestra la excepción antigua de «ciclo avanzado»', !/ciclo avanzado/.test(T(doc.getElementById('plan'))) && !/03\/2026/.test(T(doc.getElementById('plan'))));
  doc.getElementById('dlPlan').click(); await sleep(500);
  pdf=(w.__lastPrint||{}).html||'';
  ok('TECH: el respaldo sigue citando la Circular N°05/2026 (arts. 2, 3, 4 y 10)', [2,3,4,10].every(a=>new RegExp('Circular N°05/2026, art\\. '+a+' ').test(pdf)) && !/03\/2026/.test(pdf));
  /* aviso de tope de niveles: al día en 8 → cursa el 9 → con la lectura de la Carrera, techo 9 */
  ({w,doc}=await preparar("https://miuapp.cl/?derechotech",8));
  const A=w._ancla(); 
  const btnTodos=[...doc.querySelectorAll('#hor button')].find(b=>/Todos los horarios/.test(b.textContent)); if(btnTodos){btnTodos.click(); await sleep(400);}
  const alto=[...doc.querySelectorAll('td.selc')].find(td=>/^n12/.test(td.dataset.key||''));
  let msg='';
  if(alto){ alto.click(); await sleep(350); const t=doc.getElementById('horToast'); msg=t?T(t):''; }
  ok('TECH: techo calculado = nivel '+A.techo+' (ancla '+A.anchor+')', A.anchor===9 && A.techo===9);
  ok('TECH: el aviso de niveles usa ese techo y no «+2»', /puedes inscribir hasta nivel 9/.test(msg) && !/hasta nivel 11/.test(msg));
  ok('  y explica la regla de la Carrera', /no autoriza adelantar/.test(msg));

  console.log(R.join('\n'));
  const f=R.filter(z=>z[0]==='❌').length;
  console.log('\n'+(f===0?'🎉 '+R.length+' checks OK':'⚠️ '+f+' fallos de '+R.length));
  process.exit(f===0?0:1);
}catch(e){console.error('ERR',e.message,e.stack.split('\n').slice(0,3).join(' | '));}})();
