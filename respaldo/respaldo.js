/* ═══ UApp · Respaldo de tus datos (v2.8) ═══
   Descarga en un archivo lo que la app guarda en este teléfono (avance en Estudiar, malla, notas, ramos
   inscritos y preferencias) y lo carga en otro, sin cuentas. Estilos en respaldo/respaldo.css (prefijo «rs-»).
   No incluye lo que la app puede volver a bajar (copias de evaluaciones), el contador de visitas ni el RUT. */
(function(){
  var PREFIJOS=["jornada3_v1","insc_sec_v1","malla_","notas_","uapp_","tercera_v1","cierre_v1_"];
  var TIPO="uapp-respaldo", VERSION=1;
  var MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

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
    if(ks.some(function(k){ return k.indexOf("insc_sec_v1")===0; })) r.push("tus ramos inscritos");
    if(ks.some(function(k){ return k.indexOf("notas_")===0||k==="uapp_notas_carrera_v1"; })) r.push("tus notas");
    return r;
  }
  function revisar(o){
    if(!o||o.tipo!==TIPO||!o.datos||typeof o.datos!=="object") return {ok:false,motivo:"Este archivo no es un respaldo de UApp."};
    if(+o.version>VERSION) return {ok:false,motivo:"El respaldo es de una versión más nueva de UApp. Actualiza la app y vuelve a intentarlo."};
    var ks=Object.keys(o.datos).filter(function(k){ return propia(k)&&typeof o.datos[k]==="string"; });
    if(!ks.length) return {ok:false,motivo:"El respaldo está vacío."};
    return {ok:true,claves:ks,fecha:o.fecha||"",resumen:resumir(o.datos)};
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
