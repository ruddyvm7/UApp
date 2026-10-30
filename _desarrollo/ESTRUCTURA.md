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
| `sw.js` | Service worker: hace que la app funcione sin conexión. |
| `manifest.json`, íconos, `logo-ccee.png` | Instalación como app y logo del CCEE. |
| `panel-admin.html` | Panel de la directiva para publicar avisos y evaluaciones (Supabase). |
| `prueba-diurno/`, `carga-2026/` | Páginas aparte: ambiente de pruebas y carga académica. |
| `_desarrollo/versionar.py` | Revisa los mazos y pone al día índice y versiones. **Correrlo antes de publicar.** |
| `_desarrollo/pruebas/` | Pruebas automáticas (ver más abajo). |

## Cómo llega la app al teléfono

1. `index.html` se pide siempre primero a internet; si no hay conexión, se usa la copia guardada.
2. Los archivos que `index.html` carga con versión (`estudiar.js?v=…`, `estudiar.css?v=…`, el logo) quedan guardados
   en el teléfono, en la caché `uapp-recursos`. La versión es una huella del contenido: si el archivo cambia, cambia
   su dirección, y ningún teléfono mezcla un archivo viejo con uno nuevo.
3. Estudiar no descarga el contenido de los ramos al abrir la app. Con el índice muestra líneas, ramos, temas y avance;
   el contenido de un ramo se descarga recién cuando el estudiante lo abre. Los ramos que ya empezó se guardan solos
   para estudiar sin conexión. Si no hay internet la primera vez, la app lo explica y ofrece «Reintentar».

## Reglas de trabajo

1. **Una sección, un archivo.** Estudiar ya está separada. Las demás (Fechas, Horario, Avance…) pasan a su propio
   archivo cuando una versión las toque, no todas de una vez. Mismo esquema: `seccion/seccion.js` y `seccion/seccion.css`,
   cargados desde `index.html` con `?v=0` (luego `versionar.py` pone la versión real).
2. **Prefijo por sección** en toda clase o id nuevo, para que no choquen: `es-` en Estudiar. Otros ya en uso: `i2-` (Inicio),
   `sem-` (Esta semana), `cv-` (conversor de puntaje), `pr-` (promedio), `mv-` (malla), `guia-`, `dona-`.
3. **Separar lo que calcula de lo que dibuja.** Las funciones que calculan (próxima evaluación, repaso espaciado,
   promedios) no deben tocar la pantalla. Así se prueban solas y se podrían reutilizar si algún día la app pasa a un framework.
4. **No cambiar las claves guardadas en el teléfono** (tabla de abajo) sin migrar lo guardado, o el estudiante pierde su avance.
5. **Antes de publicar:** `python3 _desarrollo/versionar.py` y las pruebas.

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
| `insc_sec_v1_<período>` | Ramos inscritos y sus secciones (Horarios). |
| `malla_derecho_v4`, `malla_noajustada_v1`, `malla_sem_<jornada>_v1`, `malla_nasem_<jornada>_v1` | Ramos aprobados en la malla (Avance). |
| `uapp_notas_carrera_v1` | Notas para el promedio acumulado. |
| `uapp_estudio_v1` | Estudiar: estado de cada tarjeta (`c`), actividad por día (`h`), rondas de preguntas (`p`), nuevas por día (`n`), ajustes (`cfg`), registro de respuestas (`r`) y errores reportados (`rep`). |
| `evdet_v1_<jornada>` | Copia de las evaluaciones publicadas (hora y sala), para verlas sin conexión. |
| `visita_v1` | Último día en que se contó la visita (contador anónimo). |

Hay otras claves menores (preferencias y avisos ya vistos); para verlas todas, buscar `localStorage` en el código.
Cachés del navegador: `uapp-v5` (la app) y `uapp-recursos` (archivos con versión y mazos de Estudiar).

## Pruebas automáticas

Se corren en un computador con [Node.js](https://nodejs.org), desde `_desarrollo/pruebas`:

```
npm install                       # una vez: instala jsdom
node armar-prueba.js              # arma trabajo.html con Estudiar adentro y la red simulada
node pruebas-estudio.js           # o cualquier otra pruebas-*.js
```

`pruebas-carga.js` revisa lo propio de esta estructura: el índice, la descarga al abrir un ramo y el aviso sin conexión.
Si se le pasa una versión anterior de `index.html` como segundo argumento, además compara que todas las pantallas de
Estudiar se vean igual. `pruebas-notas.js` y `pruebas-semana.js` dependen de la fecha real y tienen una comprobación
que puede fallar según el día; las demás deben pasar completas.
