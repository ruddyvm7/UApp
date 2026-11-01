#!/usr/bin/env bash
# UApp · Monitoreo de miuapp.cl (v2.8.2). Lo corre .github/workflows/monitoreo.yml cada hora; también sirve a mano:
#   bash _desarrollo/monitoreo.sh
# Revisa, sin tocar datos de nadie:
#   · que la app, su service worker, el panel y la página de la coordinación respondan;
#   · que cada archivo con versión (?v=…) publicado calce con su versión: una publicación a medias se nota aquí;
#   · que Supabase entregue los avisos públicos (de paso, la consulta evita que el plan gratis pause el proyecto);
#   · que el certificado no esté por vencer y que HSTS siga activo.
# Si algo falla, espera un poco y revisa de nuevo antes de dar la alarma (un corte de segundos no avisa).
# Escribe el resultado en $RESUMEN (si está definido) y termina con error si algo sigue fallando.
set -uo pipefail
SITIO="${SITIO:-https://miuapp.cl}"
SUPA="https://pohrbljeamhfkcjxikct.supabase.co"
LLAVE="sb_publishable_XVNXhyYjebrrs0R0oKgLZw_9tBbDazZ"   # llave pública: la misma que lleva index.html
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

pedir() {  # pedir URL ARCHIVO [encabezado] → escribe el código HTTP (000 si no hubo respuesta)
  local c
  c=$(curl -sS -L --max-time 30 --retry 2 --retry-delay 5 -A "UApp-monitoreo (GitHub Actions)" ${3:+-H "$3"} \
        -o "$2" -w '%{http_code}' "$1" 2>/dev/null) || true
  echo "${c:-000}"
}

revisar() {
  mal=0; lineas=()
  bien() { lineas+=("✅ $1"); }
  falla() { lineas+=("❌ $1"); mal=$((mal + 1)); }

  local c
  c=$(pedir "$SITIO/" "$tmp/app.html")
  if [ "$c" = 200 ] && grep -q "<title>" "$tmp/app.html" && grep -q "serviceWorker" "$tmp/app.html"; then bien "La app responde ($SITIO/)"
  else falla "La app no responde bien ($SITIO/ → código $c)"; fi

  c=$(pedir "$SITIO/sw.js" "$tmp/sw.js")
  if [ "$c" = 200 ] && grep -q 'const CACHE = "uapp-v' "$tmp/sw.js"; then bien "El service worker responde"
  else falla "El service worker no responde bien (sw.js → código $c)"; fi

  local pagina ruta v archivo h n=0 malos=0; local -a detalle=()
  for pagina in "" "carga-2026/"; do
    if [ -n "$pagina" ]; then
      c=$(pedir "$SITIO/$pagina" "$tmp/pagina.html")
      if [ "$c" = 200 ]; then bien "La página de la coordinación responde"; else falla "La página de la coordinación no responde ($pagina → código $c)"; continue; fi
    else cp "$tmp/app.html" "$tmp/pagina.html"; fi
    while read -r ruta v; do
      [ -z "$ruta" ] && continue
      n=$((n + 1)); archivo="$tmp/v$n"
      c=$(pedir "$SITIO/$pagina$ruta?v=$v" "$archivo")
      h=$(sha1sum "$archivo" 2>/dev/null | cut -c1-12)
      if [ "$c" != 200 ] || [ "$h" != "$v" ]; then malos=$((malos + 1)); detalle+=("   · $pagina$ruta: código $c, versión publicada $v, contenido ${h:-vacío}"); fi
    done < <(grep -o -E '(src|href)="[^"?#:]+\?v=[0-9a-f]+"' "$tmp/pagina.html" | sed -E 's/^(src|href)="([^"?]+)\?v=([0-9a-f]+)"$/\2 \3/' | sort -u)
  done
  if [ "$n" -gt 0 ] && [ "$malos" -eq 0 ]; then bien "Los $n archivos con versión calzan con lo publicado"
  else falla "Hay $malos de $n archivos con versión que no calzan con lo publicado"; lineas+=("${detalle[@]}"); fi

  c=$(pedir "$SITIO/panel-admin.html" "$tmp/panel.html")
  if [ "$c" = 200 ] && grep -q "supabase" "$tmp/panel.html"; then bien "El panel de la directiva responde"
  else falla "El panel de la directiva no responde (código $c)"; fi

  c=$(pedir "$SUPA/rest/v1/avisos?select=id&limit=1" "$tmp/avisos.json" "apikey: $LLAVE")
  if [ "$c" = 200 ] && grep -q '^\[' "$tmp/avisos.json"; then bien "Supabase entrega los avisos"
  else falla "Supabase no entrega los avisos (código $c$( [ "$c" = 000 ] || echo ": $(head -c 160 "$tmp/avisos.json" | tr -d '\n')"))"; fi

  local hsts fin dias
  hsts=$(curl -sS -I --max-time 30 "$SITIO/" 2>/dev/null | tr -d '\r' | grep -i '^strict-transport-security:' || true)
  if [ -n "$hsts" ]; then bien "HSTS activo"; else falla "HSTS no aparece en la respuesta del sitio"; fi

  fin=$(echo | timeout 30 openssl s_client -connect "${SITIO#https://}:443" -servername "${SITIO#https://}" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$fin" ]; then
    dias=$(( ( $(date -d "$fin" +%s) - $(date +%s) ) / 86400 ))
    if [ "$dias" -ge 7 ]; then bien "Certificado vigente ($dias días más)"; else falla "El certificado vence en $dias días"; fi
  else falla "No se pudo leer el certificado"; fi
}

revisar
if [ "$mal" -gt 0 ] && [ -z "${SIN_REPETIR:-}" ]; then
  echo "Algo falló; se revisa de nuevo en 90 segundos…"; sleep 90; revisar
fi
printf '%s\n' "${lineas[@]}"
if [ -n "${RESUMEN:-}" ]; then
  { echo "Revisión del $(TZ=America/Santiago date '+%d-%m-%Y %H:%M') (hora de Chile):"; echo; printf '%s\n' "${lineas[@]}"; } > "$RESUMEN"
fi
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n\n' "${lineas[@]}" >> "$GITHUB_STEP_SUMMARY"; fi
[ "$mal" -eq 0 ]
