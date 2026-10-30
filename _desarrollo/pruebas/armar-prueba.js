/* Arma una sola página para las pruebas en jsdom: mete adentro el CSS y el JS de Estudiar y
   simula la red para los mazos (window.__sinRed = true simula estar sin conexión). */
const fs=require('fs'), path=require('path');
const repo=process.argv[2]||path.join(__dirname,'..','..'), out=process.argv[3]||path.join(__dirname,'trabajo.html');
let html=fs.readFileSync(path.join(repo,'index.html'),'utf8');
const leer=r=>fs.readFileSync(path.join(repo,r),'utf8');
let n=0;
html=html.replace(/<link rel="stylesheet" href="(estudiar\/[^"?]+)\?v=[^"]+">/g,(m,r)=>{n++;return '<style>'+leer(r)+'</style>';});
html=html.replace(/<script src="(estudiar\/[^"?]+)\?v=[^"]+"><\/script>/g,(m,r)=>{n++;const js=leer(r); if(/<\/script/i.test(js)) throw new Error('</script> dentro de '+r); return '<script>'+js+'</script>';});
const mazos={}; for(const f of fs.readdirSync(path.join(repo,'estudiar/mazos'))) if(f.endsWith('.json')) mazos[f.slice(0,-5)]=JSON.parse(leer('estudiar/mazos/'+f));
const stub='<script>window.__MAZOS_PRUEBA='+JSON.stringify(mazos).replace(/<\//g,'<\\/')+';window.__fetchLog=[];window.__sinRed=false;'+
 'window.fetch=function(u){u=String(u);window.__fetchLog.push(u);var m=/estudiar\\/mazos\\/([a-z0-9-]+)\\.json/.exec(u);'+
 'if(m&&!window.__sinRed&&window.__MAZOS_PRUEBA[m[1]]){var d=window.__MAZOS_PRUEBA[m[1]];var r={ok:true,status:200,json:function(){return Promise.resolve(JSON.parse(JSON.stringify(d)));},clone:function(){return r;}};return Promise.resolve(r);}'+
 'return Promise.reject(new TypeError("Failed to fetch"));};<\/script>';
html=html.replace(/<meta charset="utf-8">/i,m=>m+stub);
fs.writeFileSync(out,html); console.log('armado',out,'('+n+' archivos adentro,',Object.keys(mazos).length,'mazos simulados)');
