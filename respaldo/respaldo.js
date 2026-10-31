/* ═══ UApp · Respaldo de tus datos (v2.8) ═══
   Descarga en un archivo lo que la app guarda en este teléfono (avance en Estudiar, malla, notas, ramos
   inscritos y preferencias) y lo carga en otro, sin cuentas. Estilos en respaldo/respaldo.css (prefijo «rs-»).
   No incluye lo que la app puede volver a bajar (copias de evaluaciones), el contador de visitas ni el RUT. */
(function(){
  /* «insc_sec_» cubre los ramos inscritos de las tres jornadas (insc_sec_v1_… en TECH, insc_sec_diurno_v1_… y
     insc_sec_vregular_v1_… en las otras); hasta la v2.8 solo se respaldaban los de TECH */
  var PREFIJOS=["jornada3_v1","insc_sec_","malla_","notas_","uapp_","tercera_v1","cierre_v1_"];
  var TIPO="uapp-respaldo", VERSION=1;
  var MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  /* v2.8.1 · al cargar un respaldo solo se aceptan las claves que la app escribe, con la forma que la app les da.
     Un archivo editado a mano podría traer texto pensado para ejecutarse en la app: se descarta antes de guardarlo */
  var FORMAS=[
    [/^jornada3_v1$/, /^(tech|vregular|diurno)$/],
    [/^malla_sel(_(tech|vregular|diurno))?_v1$/, /^(ajustada|noajustada)$/],
    [/^uapp_req_v1$/, /^[01]$/],
    [/^(insc_sec_[A-Za-z0-9_-]{1,40}|cierre_v1_insc_sec_[A-Za-z0-9_-]{1,40}|malla_[a-z0-9_]{1,40}|notas_[a-z]{1,12}_v1|tercera_v1|uapp_(estudio|notas_carrera|a11y)_v1)$/, "json"]
  ];
  var MAX_VALOR=2000000, MAX_NODOS=200000, MAX_PROF=6;
  /* dentro del JSON: números, booleanos, null y textos cortos sin < > " ' ` ni \ (ningún dato de la app los usa) */
  function jsonLimpio(v){
    var nodos=0;
    function ok(x,prof){
      if(++nodos>MAX_NODOS||prof>MAX_PROF) return false;
      if(x===null||typeof x==="boolean") return true;
      if(typeof x==="number") return isFinite(x);
      if(typeof x==="string") return x.length<=200&&!/[<>"'`\\]/.test(x);
      if(Array.isArray(x)) return x.every(function(y){ return ok(y,prof+1); });
      if(typeof x==="object") return Object.keys(x).every(function(k){ return k.length<=120&&!/[<>"'`\\]/.test(k)&&k!=="__proto__"&&ok(x[k],prof+1); });
      return false;
    }
    try{ return ok(JSON.parse(v),0); }catch(e){ return false; }
  }
  function valorValido(k,v){
    if(typeof v!=="string"||v.length>MAX_VALOR) return false;
    for(var i=0;i<FORMAS.length;i++){
      if(!FORMAS[i][0].test(k)) continue;
      return FORMAS[i][1]==="json"?jsonLimpio(v):FORMAS[i][1].test(v);
    }
    return false;   /* clave que esta versión no conoce */
  }

  /* ── cálculos: no tocan la pantalla ── */
  function propia(k){ return PREFIJOS.some(function(p){ return k.indexOf(p)===0; }); }
  function claves(){ var out=[]; try{ for(var i=0;i<localStorage.length;i++){ var k=localStorage.key(i); if(k&&propia(k)) out.push(k); } }catch(e){} return out.sort(); }
  function hoy(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function fechaTxt(f){ var p=String(f||"").split("-"); return p.length===3?(+p[2])+" de "+MESES[+p[1]-1]+" de "+p[0]:""; }
  function armar(){ var datos={}; claves().forEach(function(k){ try{ datos[k]=localStorage.getItem(k); }catch(e){} }); return {tipo:TIPO,version:VERSION,fecha:hoy(),datos:datos}; }
  function resumir(d){
    var r=[], ks=Object.keys(d);
    try{ var e=JSON.parse(d.uapp_estudio_v1||"null"), n=e&&e.c?Object.keys(e.c).length:0; if(n) r.push(n+(n===1?" tarjeta vista en Estudiar":" tarjetas vistas en Estudiar")); }catch(x){}
    if(ks.some(function(k){ return k.indexOf("malla_")===0&&k!=="malla_sel_v1"; })) r.push("tu avance en la malla");
    if(ks.some(function(k){ return k.indexOf("insc_sec_")===0; })) r.push("tus ramos inscritos");
    if(ks.some(function(k){ return k.indexOf("notas_")===0||k==="uapp_notas_carrera_v1"; })) r.push("tus notas");
    return r;
  }
  function revisar(o){
    if(!o||o.tipo!==TIPO||!o.datos||typeof o.datos!=="object") return {ok:false,motivo:"Este archivo no es un respaldo de UApp."};
    if(+o.version>VERSION) return {ok:false,motivo:"El respaldo es de una versión más nueva de UApp. Actualiza la app y vuelve a intentarlo."};
    var todas=Object.keys(o.datos).filter(propia);
    if(todas.length>500) return {ok:false,motivo:"Este archivo no es un respaldo de UApp."};
    var ks=todas.filter(function(k){ return valorValido(k,o.datos[k]); });
    if(!ks.length) return {ok:false,motivo:todas.length?"El respaldo no tiene datos que UApp reconozca.":"El respaldo está vacío."};
    var sanos={}; ks.forEach(function(k){ sanos[k]=o.datos[k]; });
    return {ok:true,claves:ks,omitidas:todas.length-ks.length,fecha:/^\d{4}-\d{2}-\d{2}$/.test(o.fecha||"")?o.fecha:"",resumen:resumir(sanos)};
  }
  /* reemplaza lo guardado por lo del respaldo: lo que no viene en el respaldo se borra, para quedar igual que el otro teléfono */
  function restaurar(o){
    var rv=revisar(o); if(!rv.ok) return rv;
    claves().forEach(function(k){ if(!Object.prototype.hasOwnProperty.call(o.datos,k)) try{ localStorage.removeItem(k); }catch(e){} });
    rv.claves.forEach(function(k){ try{ localStorage.setItem(k,o.datos[k]); }catch(e){} });
    return {ok:true};
  }

  /* ── pantalla ── */
  var pendiente=null;
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function registrar(a){ try{ if(typeof logInteraccion==="function") logInteraccion("respaldo",a); }catch(e){} }
  function msg(html,tipo){ var m=document.getElementById("rsMsg"); if(m){ m.className="rs-msg"+(tipo?" "+tipo:""); m.innerHTML=html; } }
  function bajar(){
    var o=armar(), n=Object.keys(o.datos).length;
    if(!n){ msg("Todavía no hay nada guardado en este teléfono."); return; }
    try{
      var url=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:"application/json"})), a=document.createElement("a");
      a.href=url; a.download="uapp-respaldo-"+o.fecha+".json"; document.body.appendChild(a); a.click();
      setTimeout(function(){ try{ URL.revokeObjectURL(url); a.remove(); }catch(e){} },2000);
      var r=resumir(o.datos);
      msg("Listo: se descargó <b>uapp-respaldo-"+o.fecha+".json</b>"+(r.length?" con "+esc(r.join(", "))+".":".")+" Guárdalo donde no se pierda; trae tus datos, así que no lo compartas.","ok");
      registrar("descargar");
    }catch(e){ msg("No se pudo descargar el archivo en este navegador.","mal"); }
  }
  function leerArchivo(f){
    if(!f) return;
    var lector=new FileReader();
    lector.onload=function(){
      var o=null; try{ o=JSON.parse(lector.result); }catch(e){}
      var rv=revisar(o);
      if(!rv.ok){ pendiente=null; msg(esc(rv.motivo),"mal"); return; }
      pendiente=o;
      msg("Respaldo"+(rv.fecha?" del <b>"+esc(fechaTxt(rv.fecha))+"</b>":"")+(rv.resumen.length?": "+esc(rv.resumen.join(", "))+".":".")+
          (rv.omitidas?" "+(rv.omitidas===1?"Un dato no tiene":rv.omitidas+" datos no tienen")+" la forma que usa UApp y no se cargará"+(rv.omitidas===1?"":"n")+".":"")+
          " Al cargarlo, reemplaza lo que hay en este teléfono."+
          '<span class="rs-conf"><button type="button" class="rs-btn" data-rs="cargar">Reemplazar mis datos</button><button type="button" class="rs-btn sec" data-rs="cancelar">Cancelar</button></span>');
    };
    lector.onerror=function(){ msg("No se pudo leer el archivo.","mal"); };
    lector.readAsText(f);
  }
  function pintar(){
    var box=document.getElementById("respaldoBox"); if(!box||box.getAttribute("data-listo")) return;
    box.setAttribute("data-listo","1");
    box.innerHTML='<section class="rs-card" aria-labelledby="rsTit"><div class="rs-cab"><b id="rsTit">Respaldo de tus datos</b><span>Sin cuentas: queda en un archivo</span></div>'+
      '<p class="rs-txt">Tu avance en Estudiar, la malla, tus notas y tus ramos inscritos se guardan solo en este teléfono. Descárgalos en un archivo para guardarlos o pasarlos a otro teléfono.</p>'+
      '<div class="rs-btns"><button type="button" class="rs-btn" data-rs="bajar">Descargar respaldo</button><button type="button" class="rs-btn sec" data-rs="elegir">Cargar un respaldo</button>'+
      '<input type="file" id="rsArch" accept=".json,application/json" class="rs-oculto" tabindex="-1" aria-hidden="true"></div><div id="rsMsg" class="rs-msg" role="status" aria-live="polite"></div></section>';
    var arch=box.querySelector("#rsArch");
    arch.addEventListener("change",function(){ leerArchivo(arch.files&&arch.files[0]); arch.value=""; });
    box.addEventListener("click",function(e){
      var b=e.target.closest?e.target.closest("[data-rs]"):null; if(!b) return;
      var a=b.getAttribute("data-rs");
      if(a==="bajar") bajar();
      else if(a==="elegir") arch.click();
      else if(a==="cancelar"){ pendiente=null; msg(""); }
      else if(a==="cargar"&&pendiente){
        var r=restaurar(pendiente); pendiente=null;
        if(!r.ok){ msg(esc(r.motivo),"mal"); return; }
        registrar("cargar");
        msg("Listo: tus datos quedaron en este teléfono. La app se recarga para mostrarlos…","ok");
        setTimeout(function(){ try{ location.reload(); }catch(e){} },1200);
      }
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",pintar); else pintar();
  window.__respaldo={armar:armar,revisar:revisar,restaurar:restaurar,claves:claves};
})();
