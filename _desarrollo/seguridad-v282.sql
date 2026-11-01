-- UApp v2.8.2 · Ajustes de seguridad de la base de datos (revisión técnica, 31 de octubre de 2026)
-- Se ejecuta una vez en el editor SQL de Supabase, completo. Volver a ejecutarlo no cambia nada ni borra datos.
-- Va en una sola transacción: si una línea falla, no se aplica ninguna.
-- Las pruebas de _desarrollo/pruebas/sql/ lo cargan sobre esquema.sql y revisan que la app siga funcionando
-- con cada rol (visitante, sesión sin permiso de editor y editor).

begin;

-- 1) Permisos de las tablas: cada rol de la API queda solo con lo que la app usa.
--    Hasta ahora «anon» (cualquier visitante) y «authenticated» (quien inicia sesión en el panel) tenían todos los
--    permisos en avisos y editores, y en las demás tablas los de vaciar (truncate), referenciar, crear disparadores
--    y mantenimiento. Las políticas (RLS) ya impedían ver o cambiar filas ajenas y la API no permite vaciar una
--    tabla, pero no hay por qué tener esos permisos.
--    · avisos: todos leen los publicados; los editores publican, editan y borran («Editores pueden gestionar avisos»).
--    · editores: quien inicia sesión lee solo su propio registro (lo usan el panel y las políticas).
--    · evaluaciones: todos leen; los editores publican, editan y borran.
--    · consultas, interacciones y visitas: la app solo agrega filas; nadie las lee desde la API.
--    · vivo_salas y vivo_respuestas ya no tenían permisos: el modo en vivo pasa por sus funciones.
revoke all on table public.avisos, public.editores, public.evaluaciones,
                    public.consultas, public.interacciones, public.visitas from anon, authenticated;
grant select on table public.avisos to anon;
grant select, insert, update, delete on table public.avisos to authenticated;
grant select on table public.editores to authenticated;
grant select on table public.evaluaciones to anon;
grant select, insert, update, delete on table public.evaluaciones to authenticated;
grant insert on table public.consultas, public.interacciones, public.visitas to anon;

-- 2) Tablas nuevas: Supabase les da por defecto a anon y authenticated los permisos de vaciar, referenciar,
--    disparadores y mantenimiento. Se quitan. Los de leer y escribir no se dan solos: al crear una tabla hay que
--    darlos a mano, solo los que use la app (como en permisos-evaluaciones.sql), además de sus políticas.
alter default privileges for role postgres in schema public
  revoke truncate, references, trigger, maintain on tables from anon, authenticated;

-- 3) Funciones del modo en vivo: corren con los permisos de su dueño (security definer), así que su ruta de
--    búsqueda termina en pg_temp, como recomienda PostgreSQL y como las de los topes desde la v2.8.1.
--    Así una tabla temporal con el mismo nombre nunca reemplaza a vivo_salas o vivo_respuestas.
alter function public.vivo_crear(text, text[], text[]) set search_path = public, pg_temp;
alter function public.vivo_estado(text) set search_path = public, pg_temp;
alter function public.vivo_mover(text, text, integer, text) set search_path = public, pg_temp;
alter function public.vivo_responder(text, text, integer, integer) set search_path = public, pg_temp;
alter function public.vivo_resultados(text, integer) set search_path = public, pg_temp;

-- 4) Depósito «documentos»: los editores pueden borrar archivos.
--    Desde la v2.8.2 el panel borra el adjunto de un aviso cuando se elimina el aviso o se cambia su archivo, para
--    que no queden archivos sueltos. Borrar en el depósito pide dos políticas: ver los archivos (select) y borrarlos
--    (delete). Las descargas siguen igual: el depósito es público y sus enlaces no pasan por estas políticas.
drop policy if exists "Solo editores listan documentos" on storage.objects;
create policy "Solo editores listan documentos" on storage.objects as permissive for select to authenticated
  using (bucket_id = 'documentos' and (auth.jwt() ->> 'email') in (select email from public.editores));
drop policy if exists "Solo editores borran documentos" on storage.objects;
create policy "Solo editores borran documentos" on storage.objects as permissive for delete to authenticated
  using (bucket_id = 'documentos' and (auth.jwt() ->> 'email') in (select email from public.editores));

commit;
