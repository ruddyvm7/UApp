# UApp · cómo está armada y cómo se trabaja

Guía para quien mantenga la app: la directiva del CCEE, un estudiante que programe o Claude en una sesión nueva.
Las carpetas que empiezan con «_» (como esta) **no se publican** en miuapp.cl, pero sí se ven en GitHub.

## Qué hay en el repositorio

| Ruta | Qué es |
|---|---|
| `index.html` | La app: todas las secciones menos Estudiar. HTML, CSS y JavaScript puro, sin compilar. |
| `estudiar/estudiar.js` | Código de Estudiar, más el índice de los mazos (lo escribe `versionar.py`). |
| `estudiar/estudiar.css` | Estilos de Estudiar. Todas sus clases empiezan con `es-`. |
| `estudiar/mazos/<ramo>.json` | Contenido de cada ramo: tarjetas, preguntas y temas. Un archivo por ramo. |
| `respaldo/respaldo.js`, `respaldo/respaldo.css` | Más › Respaldo: descarga y carga un archivo con lo que la app guarda en el teléfono. No envía nada a internet. |
| `envivo/envivo.js`, `envivo/envivo.css` | Modo en vivo para ayudantías: salas con código, preguntas proyectadas y respuestas del curso (Supabase). |
| `datos/tech.js` | Malla (ajustada y no ajustada), créditos SCT y horarios del Vespertino TECH, más la regla de prerrequisitos (`prerrequisitosDe`). Desde la v2.8.2 es un solo archivo para la app y para `carga-2026/`: los horarios de cada período se cambian **solo aquí**. |
| `fuentes/` | Letras servidas desde el propio sitio (licencia OFL): Nunito para la app e IBM Plex Sans (un archivo variable, con su versión angosta) para la coordinación. Sin Google Fonts desde la v2.8.2. |
| `sw.js` | Service worker: hace que la app funcione sin conexión (ver «Cómo llega la app al teléfono»). |
| `manifest.json`, íconos, `logo-ccee.png` | Instalación como app y logo del CCEE. En la v2.8.2 se borraron cinco íconos que ya nadie usaba. |
| `panel-admin.html` | Panel de la directiva para publicar avisos y evaluaciones (Supabase). Desde la v2.8.2 borra del depósito el archivo de un aviso cuando ya ningún aviso lo usa. |
| `carga-2026/` | Página aparte de la coordinación (carga académica). El service worker no la guarda. Toma la malla y los horarios de `datos/tech.js`. |
| `prueba-diurno/` | Desde la v2.8.1 solo redirige a `/?derechodiurno` (antes era una copia vieja de la app). |
| `_desarrollo/versionar.py` | Revisa los mazos y pone al día índice y versiones. **Correrlo antes de publicar.** |
| `_desarrollo/envivo.sql` | Tablas y funciones del modo en vivo. Ya ejecutado en Supabase; al final trae la limpieza diaria opcional. |
| `_desarrollo/permisos-evaluaciones.sql` | Arreglo de permisos de la tabla `evaluaciones`. Ya ejecutado. |
| `_desarrollo/seguridad-v281.sql` | Ajustes de seguridad de la v2.8.1: funciones de los disparadores y tipos de archivo del depósito `documentos`. |
| `_desarrollo/seguridad-v282.sql` | Ajustes de la v2.8.2: cada rol de la API queda solo con los permisos que usa, las tablas nuevas ya no reciben permisos de vaciar ni referenciar, las funciones del modo en vivo terminan su ruta de búsqueda en `pg_temp` y los editores pueden borrar archivos del depósito. Se ejecuta una vez en el editor SQL. |
| `_desarrollo/esquema.sql` | La estructura completa de la base de producción (tablas, funciones, políticas, permisos, depósito, tarea diaria), sin datos. Sirve para revisarla y para recrearla desde cero. |
| `_desarrollo/exportar-esquema.sql` | Consulta que solo lee y devuelve el texto de `esquema.sql`. Después de cambiar algo en Supabase, se ejecuta y se reemplaza el archivo. |
| `_desarrollo/monitoreo.sh` | Revisa miuapp.cl, sus archivos con versión, Supabase, el certificado y HSTS. |
| `.github/workflows/pruebas.yml` | Integración continua: en cada cambio, GitHub revisa versiones, corre todas las pruebas de la app y prueba la base en un PostgreSQL 17. |
| `.github/workflows/monitoreo.yml` | Cada hora corre `monitoreo.sh`; si algo falla dos veces seguidas abre un aviso («issue») en el repositorio y lo cierra solo cuando vuelve. GitHub pausa las tareas programadas tras 60 días sin cambios en el repositorio: basta un commit para reactivarlas. |
| `_desarrollo/pruebas/` | Pruebas automáticas (ver más abajo). |

## Cómo llega la app al teléfono

1. `index.html` se pide siempre primero a internet; si no hay conexión, se usa la copia guardada. Se guarda una sola
   copia, sin los parámetros del enlace (`?derechotech` y `?x=1` usan la misma).
2. Los archivos que `index.html` carga con versión (`estudiar.js?v=…`, `estudiar.css?v=…`, el logo) quedan guardados
   en el teléfono, en la caché `uapp-recursos`. La versión es una huella del contenido (los primeros 12 caracteres del
   SHA-1 del archivo): si el archivo cambia, cambia su dirección, y ningún teléfono mezcla un archivo viejo con uno nuevo.
   Desde la v2.8.1 el service worker comprueba esa huella antes de entregar o guardar un archivo: una copia alterada o
   dañada se descarta y se vuelve a bajar.
3. Estudiar no descarga el contenido de los ramos al abrir la app. Con el índice muestra líneas, ramos, temas y avance;
   el contenido de un ramo se descarga recién cuando el estudiante lo abre. Los ramos que ya empezó se guardan solos
   para estudiar sin conexión. Si no hay internet la primera vez, la app lo explica y ofrece «Reintentar».

4. Cuando hay una versión nueva del service worker, la app no se recarga sola: muestra «Hay una versión nueva de UApp»
   con un botón para actualizar, para no cortar un simulacro o una sala en vivo. En la primera visita no se recarga.
5. El panel (`panel-admin.html`) y `carga-2026/` quedan fuera del service worker: siempre desde internet, sin copia.
   Las respuestas opacas, con error o redirigidas no se guardan.

## Reglas de trabajo

1. **Una sección, un archivo.** Estudiar ya está separada. Las demás (Fechas, Horario, Avance…) pasan a su propio
   archivo cuando una versión las toque, no todas de una vez. Mismo esquema: `seccion/seccion.js` y `seccion/seccion.css`,
   cargados desde `index.html` con `?v=0` (luego `versionar.py` pone la versión real).
2. **Prefijo por sección** en toda clase o id nuevo, para que no choquen: `es-` en Estudiar, `rs-` en Respaldo y `ev-` en
   el modo en vivo. Otros ya en uso: `i2-` (Inicio), `sem-` (Esta semana), `cv-` (conversor de puntaje), `pr-` (promedio),
   `mv-` (malla), `guia-`, `dona-`.
3. **Separar lo que calcula de lo que dibuja.** Las funciones que calculan (próxima evaluación, repaso espaciado,
   promedios) no deben tocar la pantalla. Así se prueban solas y se podrían reutilizar si algún día la app pasa a un framework.
4. **No cambiar las claves guardadas en el teléfono** (tabla de abajo) sin migrar lo guardado, o el estudiante pierde su avance.
5. **Antes de publicar:** `python3 _desarrollo/versionar.py` (pone al día las versiones de `index.html` y de `carga-2026/index.html`)
   y las pruebas (`node correr-todas.js`). GitHub las corre de nuevo en cada cambio.
6. **Accesibilidad** (v2.8.1): el texto en color vino usa `var(--wine)` y los botones con texto blanco `var(--wine-fondo)`
   (en el tema oscuro son colores distintos, para que los dos tengan contraste). Una ventana nueva se abre con
   `uappDialogo.abrir(fondo, caja, cerrar)` y se cierra llamando `uappDialogo.cerrado(fondo)`: así el foco entra, no se
   escapa con Tab, Esc la cierra y el foco vuelve al botón que la abrió. Texto solo para lectores de pantalla: clase `sr-solo`.
7. **Una sola copia de cada dato.** La malla, los créditos y los horarios del Vespertino TECH están en `datos/tech.js`; la
   regla de prerrequisitos es `prerrequisitosDe(ramo, malla)`. Hasta la v2.8.1 la coordinación tenía su propia copia de la
   regla y se había separado: nunca mostraba como inscribibles el Seminario, la Clínica ni el Taller de Integración III.
   Una prueba (`pruebas-coordinacion.js`) avisa si vuelve a aparecer una copia.

## Agregar o corregir tarjetas

- Cada ramo es `estudiar/mazos/<ramo>.json`, con una tarjeta o pregunta por línea.
- Tarjeta: `id`, `t` (término), `d` (definición), `r` (fuente) y, si el ramo tiene temas, `u` (número del tema).
- Pregunta: `id`, `q`, `o` (alternativas), `ok` (la correcta; 0 es la primera), `por` (explicación), `r` y `u`.
- Temas: `[{"n":1,"t":"…"}, {"n":2,"t":"…"}]`, numerados desde 1.
- **Nunca cambiar el `id` de una tarjeta que ya existe**: el avance de cada estudiante está guardado con ese código.
- Ramo nuevo: crear el archivo con `"ramo"` escrito igual que en la malla. Aparece solo en su línea.
- Después, correr `python3 _desarrollo/versionar.py`: revisa todo y avisa si algo está mal antes de cambiar nada.

## Lo que guarda cada teléfono

Nada de esto viaja a Supabase: queda solo en el teléfono del estudiante (`localStorage`).

| Clave | Qué guarda |
|---|---|
| `jornada3_v1` | Jornada elegida: `tech`, `vregular` o `diurno`. |
| `insc_sec_v1_<período>`, `insc_sec_<jornada>_v1_<período>` | Ramos inscritos y sus secciones (Horarios): TECH y las otras dos jornadas. |
| `malla_derecho_v4`, `malla_noajustada_v1`, `malla_sem_<jornada>_v1`, `malla_nasem_<jornada>_v1` | Ramos aprobados en la malla (Avance). |
| `uapp_notas_carrera_v1` | Notas para el promedio acumulado. |
| `uapp_estudio_v1` | Estudiar: estado de cada tarjeta (`c`), actividad por día (`h`), rondas de preguntas (`p`), nuevas por día (`n`), ajustes (`cfg`), registro de respuestas (`r`) y errores reportados (`rep`). Al cargarse se revisa campo por campo (`sanear()` en `estudiar.js`): lo que no tiene la forma esperada se descarta. |
| `evdet_v1_<jornada>` | Copia de las evaluaciones publicadas (hora y sala), para verlas sin conexión. |
| `visita_v1` | Último día en que se contó la visita (contador anónimo). |

Hay otras claves menores (preferencias y avisos ya vistos); para verlas todas, buscar `localStorage` en el código.
Cachés del navegador: `uapp-v7` (la app y la letra; `uapp-v5` hasta la v2.8 y `uapp-v6` en la v2.8.1) y `uapp-recursos` (archivos con versión, como `datos/tech.js`, y mazos de Estudiar).

El respaldo copia las claves que empiezan con `jornada3_v1`, `insc_sec_`, `malla_`, `notas_`, `uapp_`, `tercera_v1` y
`cierre_v1_`; deja fuera el RUT (`rut_v1`), el contador de visitas y la copia de evaluaciones. Al cargar un respaldo solo
se aceptan las claves que la app escribe (`FORMAS` en `respaldo/respaldo.js`) y, dentro de ellas, números, fechas y textos cortos sin los signos < > " ' ni acento grave ni barra invertida: un archivo editado a mano no puede meter código en la app. Si se agrega una clave nueva que el
estudiante querría conservar, hay que sumarla a `PREFIJOS` **y** a `FORMAS`.
El modo en vivo guarda en `sessionStorage` (solo mientras la pestaña está abierta) `ev_yo`: un código al azar que identifica
al teléfono dentro de una sala, sin nombre.

## Supabase: qué hay y quién puede leer

Proyecto `uapp-produccion`, región `sa-east-1` (São Paulo). La app usa solo la clave pública, siempre como anónima
(desde la v2.8.1 no guarda ni lee sesiones: el panel tiene la suya); lo que esa clave puede hacer lo deciden los permisos
(`grant`) y las políticas de cada tabla. Todo está en `_desarrollo/esquema.sql`. Revisado el 31 de octubre de 2026
(con los ajustes de `seguridad-v282.sql`):

| Tabla | La app (anónima) | El panel (editores) |
|---|---|---|
| `visitas`, `interacciones`, `consultas` | Solo agregar filas; no puede leerlas | — (se ven en el panel de Supabase) |
| `avisos` | Lee los publicados | Lee y edita todos |
| `evaluaciones` | Lee todas | Lee y edita (permisos arreglados el 30 de octubre con `permisos-evaluaciones.sql`) |
| `editores` | Nada | Cada editor ve solo su fila |
| `vivo_salas`, `vivo_respuestas` | Nada directo: solo las funciones `vivo_*` (con topes desde la v2.8.1) | — |
| Depósito `documentos` | Lee los archivos públicos | Sube PDF, Office e imágenes (sin HTML ni SVG desde `seguridad-v281.sql`); desde `seguridad-v282.sql` también los ve y los borra |

Una tabla nueva necesita las dos cosas: sus políticas **y** su `grant` a `anon`/`authenticated`, solo con lo que la app
use (`select`, `insert`, `update` o `delete`). Sin el `grant`, la API responde «permission denied» (código 42501) aunque la
política exista. RLS se activa sola en cada tabla nueva (disparador de eventos `ensure_rls`). Después de cualquier cambio
en la base: ejecutar `exportar-esquema.sql`, reemplazar `esquema.sql` y correr las pruebas de la base.

## Pruebas automáticas

Se corren en un computador con [Node.js](https://nodejs.org), desde `_desarrollo/pruebas`:

```
npm install                       # una vez: instala jsdom
node correr-todas.js              # arma trabajo.html y corre todas; sale con error si algo falla
node pruebas-estudio.js           # o una sola (después de node armar-prueba.js)
```

GitHub las corre solas en cada cambio (`.github/workflows/pruebas.yml`), con la hora de Chile.

Desde la v2.8.2 también hay pruebas del service worker (`pruebas-sw.js`, en Node, con la red y las cachés simuladas),
del panel (`pruebas-panel.js`, con un Supabase simulado: permisos, adjuntos y el borrado de archivos) y de la página de
la coordinación (`pruebas-coordinacion.js`, con un reporte inventado). Todos los datos de prueba son ficticios.

Pruebas de la base (`_desarrollo/pruebas/sql/`): `correr.sh` arma una base vacía con lo mínimo de Supabase
(`supabase-simulado.sql`), carga `esquema.sql`, comprueba que exportarla de nuevo da el mismo texto, aplica los
`seguridad-v*.sql` y corre `pruebas-base.sql` como visitante, como sesión sin permiso y como editora: qué puede leer,
escribir o borrar cada una, los topes por minuto, el modo en vivo completo y que una tabla nueva quede cerrada. Necesita
PostgreSQL 16 o más nuevo (`PGHOST=… PGUSER=postgres bash _desarrollo/pruebas/sql/correr.sh`); GitHub usa el 17.

`pruebas-carga.js` revisa lo propio de esta estructura: el índice, la descarga al abrir un ramo y el aviso sin conexión.
`pruebas-v27.js` cubre mediciones, calendario de actividad y simulacro; `pruebas-v28.js`, desafíos por enlace y respaldo;
`pruebas-v281.js`, las correcciones de la revisión técnica (respaldos con código, enlaces y salas con datos raros, la app
sin la sesión del panel y la fecha de Chile en la solicitud);
`pruebas-envivo.js` arma una sala completa (anfitrión y participante) contra un servidor simulado que se comporta como
las funciones de `envivo.sql`.
Si se le pasa una versión anterior de `index.html` como segundo argumento, además compara que todas las pantallas de
Estudiar se vean igual. Todas usan una fecha fija (desde la v2.8.1 también `pruebas-notas.js` y `pruebas-semana.js`), así
que deben pasar completas cualquier día.
