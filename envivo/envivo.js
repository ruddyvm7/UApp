/* ═══ UApp · Modo en vivo para ayudantías (v2.8) ═══
   Quien dirige crea una sala con preguntas de un ramo y muestra un código; cada estudiante entra con ese
   código y responde en su teléfono; se ven al instante cuántos respondieron y qué eligieron. Sin cuentas
   ni nombres: cada teléfono es un código al azar que se olvida al cerrar la pestaña.
   Base de datos: las tablas vivo_salas y vivo_respuestas de Supabase, a las que solo se llega por las
   funciones vivo_crear, vivo_estado, vivo_mover, vivo_responder y vivo_resultados (ver _desarrollo/envivo.sql).
   Usa el contenido de Estudiar (window.__estudio). Estilos en envivo/envivo.css (prefijo «ev-»). */
(function(){
  var L="ABCDEF", CANT=[5,10,15,20], ESPACIO=2000;
  var P=null;   /* la sesión abierta: {rol:"anfitrion"|"participante", codigo, clave?, mazo, preguntas, ordenes, actual, fase, ...} */
  var reloj=null, ultimo="";

  /* ── utilidades ── */
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function plural(n,s,p){ return n+" "+(n===1?s:p); }
  function mezclar(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), x=a[i]; a[i]=a[j]; a[j]=x; } return a; }
  function cliente(){ return (typeof sbc!=="undefined"&&sbc&&sbc.rpc)?sbc:null; }
  function rpc(nombre,params){
    var c=cliente(); if(!c) return Promise.reject(new Error("sin servidor"));
    return c.rpc(nombre,params).then(function(r){ if(r&&r.error) throw new Error(r.error.message||"error"); return r?r.data:null; });
  }
  function yo(){
    try{ var v=sessionStorage.getItem("ev_yo"); if(v) return v; }catch(e){}
    var b=new Uint8Array(8); try{ crypto.getRandomValues(b); }catch(e){ for(var i=0;i<8;i++) b[i]=Math.floor(Math.random()*256); }
    var id=Array.prototype.map.call(b,function(x){ return ("0"+x.toString(16)).slice(-2); }).join("");
    try{ sessionStorage.setItem("ev_yo",id); }catch(e){}
    return id;
  }
  function estudio(){ return window.__estudio||null; }
  function pregunta(id){ var E=estudio(), M=E&&E.mazos[P.mazo]; return M?M.preguntas.filter(function(q){ return q.id===id; })[0]||null:null; }
  function registrar(a){ try{ if(typeof logInteraccion==="function") logInteraccion("en vivo",a); }catch(e){} }

  /* ── panel ── */
  function panel(){
    var el=document.getElementById("evApp");
    if(!el){
      el=document.createElement("div"); el.id="evApp"; el.className="ev-panel"; el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); el.setAttribute("aria-labelledby","evTit");
      el.addEventListener("click",alClic); el.addEventListener("submit",function(e){ e.preventDefault(); entrar(); });
      document.body.appendChild(el);
    }
    return el;
  }
  function abrirPanel(){ var el=panel(); el.style.display=""; document.documentElement.classList.add("ev-abierto"); }
  function cerrarPanel(){
    parar(); var el=document.getElementById("evApp"); if(el){ el.style.display="none"; el.innerHTML=""; }
    document.documentElement.classList.remove("ev-abierto"); P=null; ultimo="";
  }
  function pintar(){
    if(!P) return;
    var el=panel(), html=P.rol==="anfitrion"?vistaAnfitrion():vistaParticipante();
    if(html===ultimo) return;   /* el sondeo no vuelve a dibujar si nada cambió (no pierde el foco) */
    ultimo=html;
    el.innerHTML='<div class="ev-cab"><b id="evTit">Modo en vivo</b>'+(P.codigo?'<span class="ev-sala">Sala '+esc(P.codigo)+'</span>':'')+
      '<button type="button" class="ev-x" data-ev="cerrar" aria-label="'+(P.rol==="anfitrion"&&P.codigo&&P.fase!=="fin"?'Terminar la sala y cerrar':'Cerrar')+'">✕</button></div><div class="ev-cuerpo">'+html+'</div>';
    var f=el.querySelector("[data-foco]"); if(f){ try{ f.focus({preventScroll:true}); }catch(e){} }
  }
  function msj(t){ return t?'<p class="ev-msj" role="alert">'+esc(t)+'</p>':''; }
  function opciones(q,orden,marcar){
    return '<div class="ev-ops">'+orden.map(function(real,idx){
      var cls="ev-op"+(marcar?marcar(real,idx):"");
      return '<button type="button" class="'+cls+'" data-ev="op" data-v="'+idx+'"'+(P.rol==="anfitrion"||P.fase!=="pregunta"?' disabled':'')+'><b>'+L.charAt(idx)+'</b><span>'+esc(q.o[real])+'</span></button>';
    }).join("")+'</div>';
  }
  function barras(q,orden,conteo){
    var tot=0; orden.forEach(function(real,idx){ tot+=conteo[idx]||0; });
    return '<div class="ev-barras" aria-label="Resultados del curso">'+orden.map(function(real,idx){
      var n=conteo[idx]||0, p=tot?Math.round(n/tot*100):0;
      return '<div class="ev-barra'+(real===q.ok?' ok':'')+'"><span class="ev-b-l">'+L.charAt(idx)+'</span><span class="ev-b-t"><i style="width:'+p+'%"></i></span><span class="ev-b-n">'+n+'</span></div>';
    }).join("")+'</div><p class="ev-nota">'+plural(tot,"respuesta","respuestas")+'</p>';
  }

  /* ── participante ── */
  function vistaUnirse(){
    return '<form class="ev-form" novalidate><h2 class="ev-h">Entra a la sala</h2><p class="ev-txt">Escribe el código que muestra quien dirige la ayudantía.</p>'+
      '<label class="ev-lbl" for="evCod">Código</label><input id="evCod" class="ev-cod" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" value="'+esc(P.borrador||"")+'" data-foco>'+
      '<button type="submit" class="ev-btn">Entrar</button>'+msj(P.error)+'<p class="ev-nota">No pide tu nombre: en la sala apareces solo como una respuesta más.</p></form>';
  }
  function vistaParticipante(){
    if(!P.codigo) return vistaUnirse();
    if(P.cargando) return '<p class="ev-txt">Abriendo la sala…</p>'+msj(P.error);
    var n=P.preguntas.length;
    if(P.fase==="espera") return '<h2 class="ev-h">'+esc(P.ramo)+'</h2><p class="ev-txt ev-espera">Esperando que empiece…</p>'+msj(P.error);
    if(P.fase==="fin"){
      var bien=0; Object.keys(P.mias).forEach(function(i){ if(P.mias[i].ok) bien++; });
      return '<h2 class="ev-h">Terminó la sala</h2><p class="ev-grande">'+bien+' de '+n+'</p><p class="ev-txt">'+plural(Object.keys(P.mias).length,"pregunta respondida","preguntas respondidas")+'.</p><button type="button" class="ev-btn" data-ev="cerrar" data-foco>Volver a UApp</button>';
    }
    var i=P.actual, q=pregunta(P.preguntas[i]), orden=P.ordenes[i].split("").map(Number), mia=P.mias[i];
    if(!q) return msj("Esta pregunta no está en tu versión de UApp. Actualiza la app.");
    var h='<p class="ev-paso">Pregunta '+(i+1)+' de '+n+'</p><p class="ev-preg">'+esc(q.q)+'</p>';
    if(P.fase==="pregunta"){
      h+=opciones(q,orden,function(real,idx){ return mia&&mia.idx===idx?" sel":""; });
      h+='<p class="ev-nota" role="status">'+(mia?(mia.enviando?'Enviando…':'Respuesta enviada. Puedes cambiarla mientras la pregunta siga abierta.'):'Elige una alternativa.')+'</p>';
    } else {
      h+=opciones(q,orden,function(real,idx){ return real===q.ok?" ok":(mia&&mia.idx===idx?" mal":""); });
      h+='<div class="ev-por"><b>'+(mia?(mia.ok?'¡Correcta!':'La correcta era la '+L.charAt(orden.indexOf(q.ok))):'No respondiste esta')+'</b><p>'+esc(q.por)+'</p></div>';
      if(P.conteo) h+=barras(q,orden,P.conteo);
    }
    return h+msj(P.error);
  }
  function entrar(){
    var inp=document.getElementById("evCod"), cod=String(inp?inp.value:"").toUpperCase().replace(/[^A-Z0-9]/g,"");
    P.borrador=cod;
    if(cod.length<4){ P.error="El código tiene 5 letras y números."; ultimo=""; pintar(); return; }
    P.error=""; P.cargando=true; P.codigo=cod; ultimo=""; pintar();
    rpc("vivo_estado",{p_codigo:cod}).then(function(d){
      var s=Array.isArray(d)?d[0]:d;
      if(!s){ P.codigo=null; P.cargando=false; P.error="No encontramos esa sala. Revisa el código."; ultimo=""; pintar(); return; }
      var E=estudio(); if(!E||!E.indice[s.mazo]) throw new Error("Esta sala usa un ramo que tu UApp no tiene. Actualiza la app.");
      P.mazo=s.mazo; P.ramo=E.mazos[s.mazo].ramo; P.preguntas=s.preguntas; P.ordenes=s.ordenes;
      return E.cargar(s.mazo).then(function(){ P.cargando=false; aplicar(s); registrar("unirse"); andar(); });
    }).catch(function(e){ P.cargando=false; if(!P.preguntas) P.codigo=null; P.error=/sin servidor|fetch|network/i.test(e.message)?"Sin conexión con el servidor. Revisa tu internet.":e.message; ultimo=""; pintar(); });
  }
  function aplicar(s){
    var cambio=(s.actual!==P.actual||s.fase!==P.fase);
    P.actual=s.actual; P.fase=s.fase; P.respuestas=s.respuestas||0; P.error="";
    if(cambio) P.conteo=null;
    if(P.fase==="respuesta"&&!P.conteo) traerConteo();
    if(P.fase==="fin") parar();
    pintar();
  }
  function responder(idx){
    if(!P||P.rol!=="participante"||P.fase!=="pregunta") return;
    var i=P.actual, q=pregunta(P.preguntas[i]), orden=P.ordenes[i].split("").map(Number);
    P.mias[i]={idx:idx,ok:orden[idx]===q.ok,enviando:true}; pintar();
    rpc("vivo_responder",{p_codigo:P.codigo,p_participante:yo(),p_pregunta:i,p_opcion:orden[idx]}).then(function(okSrv){
      if(P&&P.mias[i]){ P.mias[i].enviando=false; if(okSrv===false){ delete P.mias[i]; P.error="La pregunta ya se cerró."; } pintar(); }
    },function(){ if(P&&P.mias[i]){ delete P.mias[i]; P.error="No se pudo enviar. Revisa tu internet y vuelve a elegir."; ultimo=""; pintar(); } });
  }
  function traerConteo(){
    var i=P.actual;
    rpc("vivo_resultados",{p_codigo:P.codigo,p_pregunta:i}).then(function(filas){
      if(!P||P.actual!==i) return;
      var orden=P.ordenes[i].split("").map(Number), c={};
      (filas||[]).forEach(function(f){ var idx=orden.indexOf(f.opcion); if(idx>=0) c[idx]=f.n; });
      P.conteo=c; if(P.rol==="anfitrion") P.historial[i]=c; pintar();
    },function(){});
  }

  /* ── anfitrión ── */
  function vistaAnfitrion(){
    var n=P.preguntas?P.preguntas.length:0;
    if(!P.codigo){
      var disp=P.base.length, ops=CANT.filter(function(c){ return c<disp; });
      if(ops.length<CANT.length) ops.push(Math.min(disp,CANT[CANT.length-1]));
      return '<h2 class="ev-h">'+esc(P.ramo)+'</h2><p class="ev-txt">Crea una sala para responder con todo el curso: cada uno en su teléfono, sin cuentas ni nombres. Tú ves al instante qué eligieron.</p>'+
        (P.f?'<p class="ev-nota">Con las preguntas de tus temas elegidos.</p>':'')+
        '<p class="ev-lbl">¿Cuántas preguntas?</p><div class="ev-cant" role="radiogroup" aria-label="Cantidad de preguntas">'+ops.map(function(v){
          return '<button type="button" role="radio" aria-checked="'+(P.cant===v)+'" class="ev-c'+(P.cant===v?' on':'')+'" data-ev="cant" data-v="'+v+'">'+v+'</button>'; }).join("")+'</div>'+
        '<button type="button" class="ev-btn" data-ev="crear"'+(P.creando?' disabled':'')+' data-foco>'+(P.creando?'Creando…':'Crear sala')+'</button>'+msj(P.error);
    }
    if(P.fase==="espera") return '<p class="ev-txt">Pide a cada estudiante que abra UApp, entre a <b>Notas › Estudiar</b> y toque <b>Modo en vivo · Unirme</b>. El código de la sala es:</p>'+
      '<p class="ev-codigo" aria-label="Código de la sala: '+esc(P.codigo.split("").join(" "))+'">'+esc(P.codigo)+'</p><p class="ev-nota">'+esc(P.ramo)+' · '+plural(n,"pregunta","preguntas")+'</p>'+
      '<button type="button" class="ev-btn" data-ev="mover" data-v="0" data-f="pregunta" data-foco>Empezar</button>'+msj(P.error);
    if(P.fase==="fin"){
      var filas=P.preguntas.map(function(id,i){ var q=pregunta(id), c=P.historial[i]||{}, orden=P.ordenes[i].split("").map(Number), tot=0, ok=0;
        orden.forEach(function(real,idx){ tot+=c[idx]||0; if(real===q.ok) ok=c[idx]||0; });
        return '<li><span>'+esc(q?q.q:id)+'</span><small>'+(tot?Math.round(ok/tot*100)+' % acertó ('+ok+' de '+tot+')':'Sin respuestas')+'</small></li>'; }).join("");
      return '<h2 class="ev-h">Terminó la sala</h2><ol class="ev-resumen">'+filas+'</ol><button type="button" class="ev-btn" data-ev="cerrar" data-foco>Cerrar</button>';
    }
    var i=P.actual, q=pregunta(P.preguntas[i]), orden=P.ordenes[i].split("").map(Number), ultima=i+1>=n;
    var h='<p class="ev-paso">Pregunta '+(i+1)+' de '+n+' · Sala <b>'+esc(P.codigo)+'</b></p><p class="ev-preg">'+esc(q.q)+'</p>';
    if(P.fase==="pregunta"){
      h+=opciones(q,orden,null)+'<p class="ev-cuenta" role="status">'+plural(P.respuestas||0,"respuesta","respuestas")+'</p>'+
         '<button type="button" class="ev-btn" data-ev="mover" data-v="'+i+'" data-f="respuesta" data-foco>Mostrar respuesta</button>';
    } else {
      h+=opciones(q,orden,function(real){ return real===q.ok?" ok":""; })+(P.conteo?barras(q,orden,P.conteo):'<p class="ev-nota">Contando…</p>')+
         '<div class="ev-por"><b>Correcta: '+L.charAt(orden.indexOf(q.ok))+'</b><p>'+esc(q.por)+'</p></div>'+
         '<button type="button" class="ev-btn" data-ev="mover" data-v="'+(ultima?n:i+1)+'" data-f="'+(ultima?'fin':'pregunta')+'" data-foco>'+(ultima?'Terminar la sala':'Siguiente pregunta')+'</button>';
    }
    return h+msj(P.error);
  }
  function crearSala(){
    if(P.creando) return;
    var lista=mezclar(P.base.slice()).slice(0,P.cant);
    var ids=lista.map(function(q){ return q.id; }), ordenes=lista.map(function(q){ return mezclar(q.o.map(function(_,k){ return k; })).join(""); });
    P.creando=true; P.error=""; ultimo=""; pintar();
    rpc("vivo_crear",{p_mazo:P.mazo,p_preguntas:ids,p_ordenes:ordenes}).then(function(d){
      var s=Array.isArray(d)?d[0]:d; if(!s||!s.codigo) throw new Error("No se pudo crear la sala.");
      P.creando=false; P.codigo=s.codigo; P.clave=s.clave; P.preguntas=ids; P.ordenes=ordenes; P.actual=-1; P.fase="espera"; P.historial={};
      registrar("crear sala: "+P.ramo); ultimo=""; pintar(); andar();
    }).catch(function(e){ P.creando=false; P.error=/sin servidor|fetch|network/i.test(e.message)?"Sin conexión con el servidor. Revisa tu internet.":e.message; ultimo=""; pintar(); });
  }
  function mover(actual,fase){
    if(fase==="respuesta"){ P.conteo=null; }
    rpc("vivo_mover",{p_codigo:P.codigo,p_clave:P.clave,p_actual:actual,p_fase:fase}).then(function(ok){
      if(ok===false){ P.error="La sala ya no está disponible."; ultimo=""; pintar(); return; }
      P.actual=actual; P.fase=fase; P.respuestas=0; P.error=""; if(fase!=="respuesta") P.conteo=null;
      if(fase==="respuesta") traerConteo();
      if(fase==="fin") parar();
      ultimo=""; pintar();
    },function(){ P.error="No se pudo avanzar. Revisa tu internet e inténtalo de nuevo."; ultimo=""; pintar(); });
  }

  /* ── sondeo: cada 2 segundos, solo mientras el panel está abierto y visible ── */
  function andar(){ parar(); reloj=setInterval(sondear,(+window.__evPausa)||ESPACIO); }
  function parar(){ if(reloj){ clearInterval(reloj); reloj=null; } }
  function sondear(){
    if(!P||!P.codigo||document.hidden) return;
    rpc("vivo_estado",{p_codigo:P.codigo}).then(function(d){
      var s=Array.isArray(d)?d[0]:d; if(!P) return;
      if(!s){ P.fase="fin"; parar(); ultimo=""; pintar(); return; }
      if(P.rol==="participante") aplicar(s);
      else { P.respuestas=s.respuestas||0; if(P.fase==="respuesta"&&P.actual===s.actual) traerConteo(); pintar(); }
    },function(){});
  }

  /* ── eventos ── */
  function alClic(e){
    var b=e.target.closest?e.target.closest("[data-ev]"):null; if(!b||!P) return;
    var a=b.getAttribute("data-ev"), v=b.getAttribute("data-v");
    if(a==="cerrar"){ if(P.rol==="anfitrion"&&P.codigo&&P.fase!=="fin"){ rpc("vivo_mover",{p_codigo:P.codigo,p_clave:P.clave,p_actual:P.preguntas.length,p_fase:"fin"}).catch(function(){}); } cerrarPanel(); }
    else if(a==="op") responder(+v);
    else if(a==="cant"){ P.cant=+v; ultimo=""; pintar(); }
    else if(a==="crear") crearSala();
    else if(a==="mover") mover(+v,b.getAttribute("data-f"));
  }
  document.addEventListener("keydown",function(e){
    if(!P||e.key!=="Escape") return;
    if(P.rol==="participante") cerrarPanel();
  });

  /* ── entrada desde Estudiar ── */
  function unirme(){ P={rol:"participante",codigo:null,mias:{},error:""}; ultimo=""; abrirPanel(); pintar(); }
  function crear(m,f){
    var E=estudio(); if(!E||!E.mazos[m]) return;
    var M=E.mazos[m], base=f?M.preguntas.filter(function(q){ return f.indexOf(q.u)>=0; }):M.preguntas.slice();
    P={rol:"anfitrion",mazo:m,ramo:M.ramo,f:f||null,base:base,cant:Math.min(10,base.length),error:""};
    ultimo=""; abrirPanel(); pintar();
  }
  window.__envivo={unirme:unirme,crear:crear,cerrar:cerrarPanel,estado:function(){ return P; }};
})();
