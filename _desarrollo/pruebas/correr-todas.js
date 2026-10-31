/* Corre todas las pruebas de UApp: arma trabajo.html y ejecuta cada pruebas-*.js.
   Termina con error si alguna comprobación falla. La usa la integración continua de GitHub
   (.github/workflows/pruebas.yml) en cada cambio; también sirve en un computador: node correr-todas.js */
const { execFileSync } = require('child_process'), fs = require('fs');
process.chdir(__dirname);
execFileSync(process.execPath, ['armar-prueba.js'], { stdio: 'inherit' });
let conProblemas = 0;
for (const f of fs.readdirSync('.').filter(f => /^pruebas-.*\.js$/.test(f)).sort()) {
  let salida = '';
  try { salida = execFileSync(process.execPath, [f], { encoding: 'utf8', timeout: 600000, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { salida = (e.stdout || '') + '\nERR ' + e.message; }
  const lineas = salida.split('\n').map(l => l.trim());
  const bien = lineas.filter(l => l.startsWith('✅')).length, mal = lineas.filter(l => /^(❌|ERR)/.test(l));
  console.log(f + ': ' + bien + ' bien' + (mal.length ? ', ' + mal.length + ' con problemas' : ''));
  mal.forEach(l => console.log('   ' + l));
  if (mal.length || !bien) conProblemas++;
}
console.log(conProblemas ? '\n' + conProblemas + ' archivo(s) con problemas' : '\nTodas las pruebas pasan');
process.exit(conProblemas ? 1 : 0);
