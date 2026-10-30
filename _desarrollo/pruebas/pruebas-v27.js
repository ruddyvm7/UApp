/* v2.7 · medir y simular: dominio, acierto por tema, temas más débiles, calendario de 12 semanas,
   próxima prueba desde Fechas, plan de nuevas, simulacro con tiempo y nota de 1,0 a 7,0 */
const fs=require('fs'), path=require('path');const {JSDOM}=require('jsdom');
const R=[];const ok=(n,c)=>R.push((c?'✅':'❌')+' '+n);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const STUB_SB='<script>window.supabase={createClient:function(){var q={select:function(){return q},eq:function(){return q},gte:function(){return q},order:function(){return q},insert:function(){return Promise.resolve({error:null})},then:function(ok){return Promise.resolve({data:[],error:null}).then(ok)}};return {from:function(){return q}}}};<\/script>';
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'trabajo.html'),'utf8').replace(/<script src="https:\/\/cdn[^>]*supabase[^>]*><\/script>/,STUB_SB);
const DIR=path.join(__dirname,'..','..','estudiar','mazos'), mazo=k=>JSON.parse(fs.readFileSync(path.join(DIR,k+'.json'),'utf8'));
/* reloj falso que se puede adelantar (para que el simulacro se quede sin tiempo) */
function abrir(fecha,ls){return new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://miuapp.cl/?derechotech",beforeParse(w){
  const Re=w.Date,f=new Re(...fecha).getTime();let extra=0;w.__adelantar=ms=>{extra+=ms;};
  class F extends Re{constructor(...a){if(a.length)super(...a);else super(f+extra);}static now(){return f+extra;}}F.UTC=Re.UTC;F.parse=Re.parse;w.Date=F;
  Object.entries(ls||{}).forEach(([k,v])=>w.localStorage.setItem(k,v));w.scrollTo=()=>{};w.confirm=()=>true;w.matchMedia=q=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});}});}
const T=el=>el?el.textContent.replace(/\s+/g,' ').trim():'';
const clic=(doc,sel)=>{const b=doc.querySelector(sel); if(b) b.click(); return !!b;};
const BI=mazo('bienes'), TO=mazo('teoria-obligaciones');
/* avance: Bienes empezado; en Teoría, el tema 2 con poco acierto y el tema 3 con todo bien */
const q2=TO.preguntas.filter(q=>q.u===2).slice(0,6), q3=TO.preguntas.filter(q=>q.u===3).slice(0,6), t3=TO.tarjetas.filter(t=>t.u===3).slice(0,4);
const PROG={c:{['bienes/'+BI.tarjetas[0].id]:{iv:25,ef:2.6,n:4,l:0,u:'v',due:'2026-12-01',f:'2026-11-10'},['teoria-obligaciones/'+t3[0].id]:{iv:3,ef:2.5,n:1,l:0,u:'v',due:'2026-11-20',f:'2026-11-10'}},
  h:{'2026-11-03':{v:3,a:1,r:0,ok:2,tot:4},'2026-11-10':{v:5,a:0,r:2,ok:6,tot:12},'2026-11-11':{v:1,a:0,r:0,ok:0,tot:0}},p:{},n:{},cfg:{nuevas:20},rep:{},
  r:[].concat(q2.map((q,i)=>['2026-11-10','teoria-obligaciones',q.id,i<2?1:0]),q3.map(q=>['2026-11-10','teoria-obligaciones',q.id,1]),t3.map(t=>['2026-11-10','teoria-obligaciones',t.id,'v']),[['2026-11-10','teoria-obligaciones','art-'+t3[1].id,0]])};
const LS={'uapp_estudio_v1':JSON.stringify(PROG),'jornada3_v1':'tech','insc_sec_v1_2026-T3':JSON.stringify({"21":"n6s1"})};
const precargar=async w=>{ await Promise.all(Object.keys(w.__estudio.indice).map(k=>w.__estudio.cargar(k))); };
const irEstudiar=async doc=>{ clic(doc,'.tab[data-tab="pru"]'); await sleep(120); clic(doc,'#pru [data-ir="estudio"]'); await sleep(120); };
const app=doc=>doc.getElementById('estudioApp');

(async()=>{try{
  /* ═══ cálculos puros ═══ */
  let d=abrir([2026,10,12,10,0],LS), w=d.window, doc=w.document; await sleep(1100); await precargar(w);
  const M=w.__estudio.medir;
  ok('Nota de 1,0 a 7,0 al 60 %: 0/20 → 1,0 · 12/20 → 4,0 · 15/20 → 5,1 · 20/20 → 7,0 · 6/10 → 4,0', M.nota(0,20)===1&&M.nota(12,20)===4&&M.nota(15,20)===5.1&&M.nota(20,20)===7&&M.nota(6,10)===4);
  const A=M.aciertos('teoria-obligaciones');
  ok('Acierto en preguntas: '+A.preg.ok+' de '+A.preg.tot+' (las de Artículos cuentan)', A.preg.tot===13&&A.preg.ok===8);
  ok('  por tema: el tema 2 tiene 2 de 6 y el tema 3, 10 de 11', A.temas[2].ok===2&&A.temas[2].tot===6&&A.temas[3].ok===10&&A.temas[3].tot===11);
  const D=M.temasDebiles('teoria-obligaciones',3);
  ok('Temas más débiles: solo los bajo 80 % con al menos 5 respuestas ('+D.map(x=>x.t+' '+x.p+' %').join(', ')+')', D.length===1&&D[0].n===2&&D[0].p===33);
  const act=M.actividad();
  ok('Actividad: 84 días (12 semanas), 3 con estudio y '+act.total+' respuestas; la semana actual corta en hoy', act.dias.length===84&&act.activos===3&&act.total===28&&act.dias.filter(x=>x.n<0).length===3&&act.dias.at(-4).f==='2026-11-12');
  const px=M.proxima('bienes');
  ok('Próxima prueba de Bienes (inscrito en S1) tomada de Fechas: '+(px&&px.nombre+' en '+px.dias+' días, '+px.texto), !!px&&px.nombre==='2ª prueba'&&px.dias===9&&/sáb 21 nov/.test(px.texto));
  ok('  un ramo no inscrito no tiene próxima prueba', M.proxima('teoria-obligaciones')===null);
  const pl=M.planNuevas('bienes',9);
  ok('Plan: 15 nuevas en Bienes; a 20 por día se terminan hoy y bastan 2 por día para la prueba', pl.nuevas===15&&pl.diasAlRitmo===1&&pl.necesarias===2);

  /* ═══ portada, línea y ramo ═══ */
  await irEstudiar(doc);
  const cal=app(doc).querySelector('.es-cal');
  ok('Portada: calendario de las últimas 12 semanas ('+T(cal&&cal.querySelector('.es-fila'))+')', !!cal&&cal.querySelectorAll('.es-cal-g .es-cal-d').length===84&&/3 días con estudio/.test(T(cal))&&cal.querySelector('.es-cal-g').getAttribute('role')==='img'&&/con 28 respuestas/.test(cal.querySelector('.es-cal-g').getAttribute('aria-label')));
  ok('  con tonos según la cantidad y los días futuros en blanco', cal.querySelectorAll('.es-cal-g .n4').length===1&&cal.querySelectorAll('.es-cal-g .fut').length===3);
  ok('  sin prueba en los próximos 7 días, no propone simulacro', !app(doc).querySelector('[data-es="sim-ir"]'));
  clic(doc,'[data-es="linea"][data-v="civil"]'); await sleep(60);
  const bienesBtn=app(doc).querySelector('[data-es="abrir"][data-v="bienes"]');
  ok('Línea: cada ramo empezado muestra su % de dominio ('+T(bienesBtn.querySelector('small'))+')', /1 dominadas \(6 %\)/.test(T(bienesBtn)));
  clic(doc,'[data-es="abrir"][data-v="bienes"]'); await sleep(80);
  const plan=app(doc).querySelector('.es-plan');
  ok('Ramo: avisa la próxima prueba con el plan de nuevas ('+T(plan)+')', !!plan&&/Faltan 9 días para tu 2ª prueba \(sáb 21 nov\)\./.test(T(plan))&&/A tu ritmo alcanzas a ver las 15 tarjetas nuevas que te faltan/.test(T(plan)));
  const modos=[...app(doc).querySelectorAll('.es-modo b')].map(T);
  ok('  el modo Simulacro aparece junto a los otros ('+modos.join(', ')+')', modos.join('|')==='Tarjetas|Selección múltiple|Artículos|Simulacro'&&/8 preguntas, un minuto cada una y nota de 1,0 a 7,0/.test(T(app(doc).querySelector('[data-es="simulacro"]'))));
  const st=T(app(doc).querySelector('.es-stats'));
  ok('  estadísticas: dominio del ramo', /Dominio 6 % de las tarjetas/.test(st));
  clic(doc,'[data-es="ramos"]'); await sleep(40); clic(doc,'[data-es="abrir"][data-v="teoria-obligaciones"]'); await sleep(80);
  const st2=T(app(doc).querySelector('.es-stats'));
  ok('Teoría: acierto en preguntas y temas más débiles en el ramo ['+st2.slice(st2.indexOf('Dominio'))+']', /Acierto en preguntas 62 % \(8 de 13\)/.test(st2)&&/Temas más débiles.*la condición 33 % de acierto/.test(st2)&&!!app(doc).querySelector('.es-debiles li'));
  ok('  sin prueba inscrita: dice cuándo termina las nuevas a su ritmo', /Tarjetas nuevas 626 por ver; a tu ritmo terminas el 13 de diciembre/.test(st2)&&!app(doc).querySelector('.es-plan'));
  clic(doc,'[data-es="temas"]'); await sleep(60);
  const fila2=T(app(doc).querySelector('[data-es="tema"][data-v="2"]')), fila3=T(app(doc).querySelector('[data-es="tema"][data-v="3"]'));
  ok('Temas: cada tema con suficientes respuestas muestra su acierto', /33 % de acierto/.test(fila2)&&/91 % de acierto/.test(fila3)&&!/de acierto/.test(T(app(doc).querySelector('[data-es="tema"][data-v="1"]'))));
  w.close();

  /* ═══ simulacro ═══ */
  d=abrir([2026,10,15,10,0],LS); w=d.window; doc=w.document; await sleep(1100);
  await irEstudiar(doc);
  const sug=app(doc).querySelector('[data-es="sim-ir"]');
  ok('A 6 días de la prueba de un ramo empezado, la portada propone un simulacro ('+T(sug)+')', !!sug&&/Tu 2ª prueba de Bienes es en 6 días\. 8 preguntas en 8 minutos/.test(T(sug)));
  sug.click(); await sleep(150);
  const prog=()=>[...app(doc).querySelectorAll('.es-prog > *')].map(T).filter(Boolean).join(' ');
  ok('  «Empezar» abre el simulacro: 8 preguntas y 8:00 minutos', /8:00 1 de 8$/.test(prog())&&app(doc).querySelectorAll('.es-op').length===4&&!app(doc).querySelector('.es-por'));
  const correcta=()=>{ const q=BI.preguntas.find(x=>x.q===T(app(doc).querySelector('.es-preg'))); return [...app(doc).querySelectorAll('.es-op')].find(b=>T(b.querySelector('span'))===q.o[q.ok]); };
  const otra=()=>{ const q=BI.preguntas.find(x=>x.q===T(app(doc).querySelector('.es-preg'))); return [...app(doc).querySelectorAll('.es-op')].find(b=>T(b.querySelector('span'))!==q.o[q.ok]); };
  correcta().click(); await sleep(30);
  ok('  elegir marca la alternativa sin decir si es correcta', app(doc).querySelectorAll('.es-op.sel').length===1&&!app(doc).querySelector('.es-op.ok')&&/1 de 8 respondidas/.test(T(app(doc))));
  clic(doc,'[data-es="sim-sig"]'); await sleep(30);
  for(let i=1;i<8;i++){ (i<5?correcta():otra()).click(); await sleep(20); clic(doc,'[data-es="sim-sig"]'); await sleep(20); }
  const fin=[...app(doc).querySelectorAll('.es-fin > p')].map(T).join(' ');
  ok('Al terminar: nota 4,2 con 5 de 8 correctas ('+fin.slice(0,60)+'…)', /^Simulacro 4,2 5 de 8 correctas/.test(fin)&&/Aprobado/.test(fin)&&app(doc).querySelector('.es-nota').classList.contains('ok'));
  ok('  muestra las 3 que falló con la correcta y su explicación', app(doc).querySelectorAll('.es-malas > div').length===3&&/Tu respuesta: .*Correcta:/.test(T(app(doc).querySelector('.es-malas > div'))));
  const E=w.__estudio.estado(), simG=E.p['bienes#sim'].int;
  ok('  la nota queda guardada y las 8 respuestas entran al registro', simG.length===1&&simG[0].nota===4.2&&simG[0].ok===5&&E.r.filter(x=>x[1]==='bienes'&&(x[3]===1||x[3]===0)).length===8);
  clic(doc,'[data-es="salir"]'); await sleep(60);
  ok('  el ramo muestra la última nota y el historial', /Tu última nota: 4,2/.test(T(app(doc).querySelector('[data-es="simulacro"]')))&&/Simulacros 1 simulacro, mejor nota: 4,2/.test(T(app(doc).querySelector('.es-stats'))));
  clic(doc,'[data-es="simulacro"]'); await sleep(80);
  correcta().click(); await sleep(20);
  w.__adelantar(8*60*1000+500); await sleep(1300);
  const fin2=[...app(doc).querySelectorAll('.es-fin > p')].map(T).join(' ');
  ok('Si se acaba el tiempo, se corrige solo: 1 de 8 → nota '+(/Simulacro (\d,\d)/.exec(fin2)||[])[1], /^Simulacro 1,6 1 de 8 correctas · 8:00 de 8:00 minutos/.test(fin2)&&(T(app(doc).querySelector('.es-malas')).match(/Sin responder/g)||[]).length===7);
  clic(doc,'[data-es="simulacro"]'); await sleep(80);
  const ses=prog();
  clic(doc,'[data-es="salir"]'); await sleep(40);
  ok('  «✕» sale sin nota y el reloj se detiene', /^✕/.test(ses)&&w.__estudio.estado().p['bienes#sim'].int.length===2&&!app(doc).querySelector('.es-prog'));
  w.close();
}catch(e){ R.push('ERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')); }
console.log(R.join('\n')); const f=R.filter(x=>!x.startsWith('✅')).length; console.log(f?'\n'+f+' con problemas':'\nTodo bien: '+R.length+' comprobaciones');
process.exit(0);})();
