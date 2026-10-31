-- UApp v2.8.1 · Ajustes de seguridad de la base de datos (revisión técnica, 31 de octubre de 2026)
-- Se ejecuta una vez en el editor SQL de Supabase. Volver a ejecutarlo no cambia nada ni borra datos.
-- Junto con este archivo se ejecutó la versión v2.8.1 de envivo.sql (topes del modo en vivo).

-- 1) Funciones de los disparadores (topes de visitas, interacciones y consultas; autor de los avisos).
--    · Ruta de búsqueda fija: tres corren con los permisos de su dueño (security definer) y, sin ruta fija,
--      podrían terminar usando una tabla o función con el mismo nombre en otro esquema.
--    · Nadie las ejecuta desde la API: un disparador funciona igual sin este permiso (probado antes de aplicarlo).
alter function public.avisos_conserva_creador() set search_path = public, pg_temp;
alter function public.consultas_limite() set search_path = public, pg_temp;
alter function public.interacciones_limite() set search_path = public, pg_temp;
alter function public.visitas_limite() set search_path = public, pg_temp;
revoke execute on function public.avisos_conserva_creador() from public, anon, authenticated;
revoke execute on function public.consultas_limite() from public, anon, authenticated;
revoke execute on function public.interacciones_limite() from public, anon, authenticated;
revoke execute on function public.visitas_limite() from public, anon, authenticated;
-- La que activa RLS en cada tabla nueva (disparador de eventos «ensure_rls») tampoco se llama desde la API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 2) Depósito «documentos» (adjuntos de los avisos): solo PDF, Word, Excel, PowerPoint e imágenes comunes.
--    Fuera quedan HTML y SVG, que un navegador puede ejecutar si alguien abre el enlace.
--    «application/octet-stream» se acepta porque algunos computadores no informan el tipo de un .docx;
--    ese tipo se descarga y nunca se abre como página.
update storage.buckets
   set allowed_mime_types = array[
     'application/pdf',
     'application/msword',
     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
     'application/vnd.ms-powerpoint',
     'application/vnd.openxmlformats-officedocument.presentationml.presentation',
     'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
     'application/octet-stream'
   ]
 where id = 'documentos';
