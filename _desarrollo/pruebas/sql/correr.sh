#!/usr/bin/env bash
# UApp · Pruebas de la base de datos (v2.8.2)
# Arma una base vacía con lo mínimo de Supabase (supabase-simulado.sql), le carga _desarrollo/esquema.sql y:
#   1. la vuelve a exportar con exportar-esquema.sql y compara: esquema.sql describe toda la base, sin piezas sueltas;
#   2. le aplica los ajustes de seguridad (seguridad-v*.sql) y corre pruebas-base.sql con cada rol de la API.
# Necesita PostgreSQL 16 o más nuevo y un usuario con permisos de administrador (crea y borra la base «uapp_prueba»).
# La integración continua (.github/workflows/pruebas.yml) usa PostgreSQL 17, como Supabase. En un computador:
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=… bash _desarrollo/pruebas/sql/correr.sh
# Escribe «✅ …» por cada comprobación que pasa y «❌ …» por cada una que falla; termina con error si alguna falla.
set -uo pipefail
dir="$(cd "$(dirname "$0")" && pwd)"
des="$(cd "$dir/../.." && pwd)"
db="${UAPP_DB:-uapp_prueba}"
mal=0

# carga sin mostrar resultados ni avisos («ya existe», «no existe»); los errores sí se ven
cargar() { PGOPTIONS="-c client_min_messages=warning" psql -X -q -v ON_ERROR_STOP=1 -o /dev/null -d "$db" "$@"; }
PGOPTIONS="-c client_min_messages=warning" psql -X -q -v ON_ERROR_STOP=1 -d postgres -c "drop database if exists $db" -c "create database $db" || exit 1
ver=$(psql -X -At -d "$db" -c "show server_version_num") || exit 1
# PostgreSQL 16 no tiene el permiso «maintain» (llegó en el 17): se quita del texto para poder probar igual
filtro() { if [ "$ver" -lt 170000 ]; then sed -e 's/maintain, //g' -e 's/, maintain//g'; else cat; fi; }

if ! { cat "$dir/supabase-simulado.sql"; filtro < "$des/esquema.sql"; } | cargar 2>&1; then
  echo "❌ esquema.sql no se pudo cargar en una base vacía"; exit 1
fi
echo "✅ esquema.sql se carga completo en una base vacía"

esperado=$(sed -n '/^-- ══ Secuencias ══$/,$p' "$des/esquema.sql" | filtro)
obtenido=$(psql -X -At -v ON_ERROR_STOP=1 -d "$db" -f "$des/exportar-esquema.sql" | filtro)
if [ -n "$obtenido" ] && [ "$esperado" == "$obtenido" ]; then
  echo "✅ exportar-esquema.sql devuelve el mismo texto de esquema.sql (no falta nada)"
else
  echo "❌ exportar-esquema.sql no devuelve lo mismo que esquema.sql:"
  diff <(echo "$esperado") <(echo "$obtenido") | head -40 | sed 's/^/   /'
  mal=$((mal + 1))
fi

for f in "$des"/seguridad-v*.sql; do
  if filtro < "$f" | cargar 2>&1; then echo "✅ $(basename "$f") se aplica sin errores"
  else echo "❌ $(basename "$f") falló"; mal=$((mal + 1)); fi
done

salida=$(filtro < "$dir/pruebas-base.sql" | cargar 2>&1); estado=$?
echo "$salida" | sed -n 's/^.*NOTICE:  //p'
if [ $estado -ne 0 ]; then
  echo "❌ pruebas-base.sql se detuvo con un error:"; echo "$salida" | grep -v "NOTICE:" | sed 's/^/   /'; mal=$((mal + 1))
fi
mal=$((mal + $(echo "$salida" | grep -c "NOTICE:  ❌")))

psql -X -q -d postgres -c "drop database if exists $db" >/dev/null 2>&1
if [ $mal -gt 0 ]; then echo; echo "$mal problema(s) en la base"; exit 1; fi
echo; echo "La base pasa todas las pruebas"
