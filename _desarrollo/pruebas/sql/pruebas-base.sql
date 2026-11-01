-- UApp · Pruebas de permisos, políticas y topes de la base (las corre correr.sh)
-- Se ejecutan sobre esquema.sql más los ajustes de seguridad-v*.sql, en una base de prueba sin datos reales.
-- Cada comprobación escribe «✅ …» o «❌ …». Se hace pasar por cada rol de la API como lo haría Supabase:
-- «anon» es cualquier visitante de la app, «authenticated» es quien inicia sesión en el panel
-- (con o sin permiso de editor, según su correo esté o no en la tabla editores).

\set ON_ERROR_STOP on
set client_min_messages = notice;

create schema prueba;
grant usage on schema prueba to anon, authenticated;

-- ¿La instrucción funciona (espera = 'ok') o falla con ese código? 42501 = sin permiso; P0001 = tope o dato rechazado
create function prueba.hace(nombre text, sentencia text, espera text default 'ok') returns void
language plpgsql as $$
declare estado text := 'ok'; mensaje text := '';
begin
  begin
    execute sentencia;
  exception when others then
    estado := sqlstate; mensaje := sqlerrm;
  end;
  if estado = espera then raise notice '✅ %', nombre;
  else raise notice '❌ % (se esperaba %, resultó %: %)', nombre, espera, estado, mensaje;
  end if;
end $$;

-- ¿La consulta devuelve ese valor?
create function prueba.da(nombre text, consulta text, esperado text) returns void
language plpgsql as $$
declare obtenido text;
begin
  begin
    execute consulta into obtenido;
  exception when others then
    raise notice '❌ % (error %: %)', nombre, sqlstate, sqlerrm;
    return;
  end;
  if obtenido is not distinct from esperado then raise notice '✅ %', nombre;
  else raise notice '❌ % (se esperaba «%», resultó «%»)', nombre, coalesce(esperado, 'null'), coalesce(obtenido, 'null');
  end if;
end $$;
grant execute on all functions in schema prueba to anon, authenticated;

-- ── Datos de prueba (inventados) ──
insert into public.editores (email, nombre, rol) values ('editora@prueba.cl', 'Editora de prueba', 'editor');
insert into public.avisos (titulo, texto, publicado) values ('Aviso publicado', 'Texto de prueba', true), ('Borrador', 'Texto de prueba', false);
insert into public.evaluaciones (jornada, fecha, asignatura, seccion) values ('tech', date '2026-11-20', 'Ramo de prueba', 'A');
insert into storage.objects (bucket_id, name) values ('documentos', 'avisos/prueba.pdf');
insert into storage.buckets (id, name, public) values ('otro', 'otro', false);
insert into storage.objects (bucket_id, name) values ('otro', 'privado.pdf');

-- ══ Visitante (anon) ══
select set_config('request.jwt.claims', '{"role":"anon"}', false);
set role anon;
select prueba.da('Visitante: ve solo los avisos publicados', 'select count(*)::text from public.avisos', '1');
select prueba.hace('Visitante: no puede publicar avisos', $q$insert into public.avisos (titulo, publicado) values ('x', true)$q$, '42501');
select prueba.hace('Visitante: no puede cambiar avisos', $q$update public.avisos set titulo = 'x'$q$, '42501');
select prueba.hace('Visitante: no puede borrar avisos', 'delete from public.avisos', '42501');
select prueba.hace('Visitante: no puede vaciar una tabla', 'truncate public.avisos', '42501');
select prueba.hace('Visitante: no ve la lista de editores', 'select * from public.editores', '42501');
select prueba.da('Visitante: lee las evaluaciones', 'select count(*)::text from public.evaluaciones', '1');
select prueba.hace('Visitante: no puede publicar evaluaciones', $q$insert into public.evaluaciones (jornada, fecha, asignatura) values ('tech', current_date, 'x')$q$, '42501');
select prueba.hace('Visitante: envía una consulta', $q$insert into public.consultas (pregunta, jornada) values ('¿Cuándo es la prueba de Procesal?', 'tech')$q$);
select prueba.hace('Visitante: la misma consulta dos veces seguidas se rechaza', $q$insert into public.consultas (pregunta) values ('¿Cuándo es la prueba de Procesal?')$q$, 'P0001');
select prueba.hace('Visitante: una consulta de menos de 3 letras se rechaza', $q$insert into public.consultas (pregunta) values ('ok')$q$, '23514');
select prueba.hace('Visitante: no puede leer las consultas', 'select * from public.consultas', '42501');
select prueba.hace('Visitante: registra una visita', $q$insert into public.visitas (jornada, instalada) values ('tech', false)$q$);
select prueba.hace('Visitante: registra una interacción', $q$insert into public.interacciones (seccion, accion) values ('estudiar', 'abrir')$q$);
select prueba.hace('Visitante: no puede leer las visitas', 'select * from public.visitas', '42501');
select prueba.hace('Visitante: no puede leer las interacciones', 'select * from public.interacciones', '42501');
select prueba.hace('Visitante: no lee las salas en vivo directo', 'select * from public.vivo_salas', '42501');
select prueba.hace('Visitante: no lee las respuestas en vivo directo', 'select * from public.vivo_respuestas', '42501');
select prueba.hace('Visitante: no llama a las funciones de los topes', 'select public.consultas_limite()', '42501');
select prueba.da('Visitante: no ve la lista del depósito', 'select count(*)::text from storage.objects', '0');
select prueba.hace('Visitante: no puede subir archivos', $q$insert into storage.objects (bucket_id, name) values ('documentos', 'x.pdf')$q$, '42501');
select prueba.da('Visitante: no puede borrar archivos', $q$with b as (delete from storage.objects returning 1) select count(*)::text from b$q$, '0');
select prueba.hace('Visitante: una sala en vivo con datos raros se rechaza', $q$select * from public.vivo_crear('Mazo Raro', array['p1'], array['01'])$q$, 'P0001');

-- Modo en vivo de punta a punta, como lo usa la app (solo con las funciones)
do $$
declare c text; k text; ok boolean; r record; n int;
begin
  select codigo, clave into c, k from public.vivo_crear('mazo-de-prueba', array['p1', 'p2'], array['0123', '1032']);
  if c ~ '^[A-Z2-9]{5}$' and k ~ '^[0-9a-f]{32}$' then raise notice '✅ En vivo: se crea una sala con código de 5 letras y clave';
  else raise notice '❌ En vivo: código o clave con forma rara (%, %)', c, k; end if;
  select * into r from public.vivo_estado(lower(c));
  if r.fase = 'espera' and r.actual = -1 then raise notice '✅ En vivo: la sala parte esperando (y el código se acepta en minúsculas)';
  else raise notice '❌ En vivo: estado inicial raro (%, %)', r.fase, r.actual; end if;
  if not public.vivo_responder(c, 'abcdef12', 0, 1) then raise notice '✅ En vivo: no se responde antes de que se muestre la pregunta';
  else raise notice '❌ En vivo: se aceptó una respuesta antes de tiempo'; end if;
  if not public.vivo_mover(c, 'clave-equivocada', 0, 'pregunta') then raise notice '✅ En vivo: sin la clave no se mueve la sala';
  else raise notice '❌ En vivo: se movió la sala sin la clave'; end if;
  if public.vivo_mover(c, k, 0, 'pregunta') then raise notice '✅ En vivo: con la clave se muestra la pregunta';
  else raise notice '❌ En vivo: con la clave no se pudo mover la sala'; end if;
  if public.vivo_responder(c, 'abcdef12', 0, 1) and public.vivo_responder(c, 'abcdef12', 0, 2) and public.vivo_responder(c, '12345678', 0, 2)
  then raise notice '✅ En vivo: se responde y se puede cambiar la respuesta';
  else raise notice '❌ En vivo: no se pudo responder'; end if;
  if not public.vivo_responder(c, 'Nombre Real', 0, 1) then raise notice '✅ En vivo: un participante que no es un código al azar se rechaza';
  else raise notice '❌ En vivo: se aceptó un participante con nombre'; end if;
  select count(*) into n from public.vivo_resultados(c, 0);
  if n = 0 then raise notice '✅ En vivo: los resultados no se ven mientras se responde';
  else raise notice '❌ En vivo: los resultados se ven antes de tiempo'; end if;
  perform public.vivo_mover(c, k, 0, 'respuesta');
  select coalesce(string_agg(t.op || ':' || t.cuantos, ',' order by t.op), '') into k from public.vivo_resultados(c, 0) as t(op, cuantos);
  if k = '2:2' then raise notice '✅ En vivo: al mostrar la respuesta se ven los resultados (una respuesta por teléfono)';
  else raise notice '❌ En vivo: resultados raros (%)', k; end if;
exception when others then
  raise notice '❌ En vivo: falló (% %)', sqlstate, sqlerrm;
end $$;

-- Topes por minuto (entre todos los visitantes)
do $$
declare i int;
begin
  for i in 1..59 loop insert into public.consultas (pregunta) values ('Consulta de prueba número ' || i); end loop;
  begin
    insert into public.consultas (pregunta) values ('Una consulta más');
    raise notice '❌ Topes: se aceptó la consulta número 61 del minuto';
  exception when raise_exception then raise notice '✅ Topes: 60 consultas por minuto; la 61 se rechaza';
  end;
exception when others then raise notice '❌ Topes: las consultas fallaron antes del tope (% %)', sqlstate, sqlerrm;
end $$;
do $$
declare i int;
begin
  for i in 1..119 loop insert into public.visitas (jornada) values ('tech'); end loop;
  begin
    insert into public.visitas (jornada) values ('tech');
    raise notice '❌ Topes: se aceptó la visita número 121 del minuto';
  exception when raise_exception then raise notice '✅ Topes: 120 visitas por minuto; la 121 se rechaza';
  end;
exception when others then raise notice '❌ Topes: las visitas fallaron antes del tope (% %)', sqlstate, sqlerrm;
end $$;
do $$
declare i int;
begin
  for i in 1..599 loop insert into public.interacciones (seccion, accion) values ('estudiar', 'tarjeta'); end loop;
  begin
    insert into public.interacciones (seccion, accion) values ('estudiar', 'tarjeta');
    raise notice '❌ Topes: se aceptó la interacción número 601 del minuto';
  exception when raise_exception then raise notice '✅ Topes: 600 interacciones por minuto; la 601 se rechaza';
  end;
exception when others then raise notice '❌ Topes: las interacciones fallaron antes del tope (% %)', sqlstate, sqlerrm;
end $$;
do $$
declare i int;
begin
  -- ya hay una sala de la prueba anterior: 29 más llegan al tope de 30 cada 10 minutos
  for i in 1..29 loop perform public.vivo_crear('mazo-de-prueba', array['p1'], array['01']); end loop;
  begin
    perform public.vivo_crear('mazo-de-prueba', array['p1'], array['01']);
    raise notice '❌ Topes: se creó la sala número 31 en 10 minutos';
  exception when raise_exception then raise notice '✅ Topes: 30 salas en vivo cada 10 minutos; la 31 se rechaza';
  end;
exception when others then raise notice '❌ Topes: las salas fallaron antes del tope (% %)', sqlstate, sqlerrm;
end $$;

-- ══ Sesión iniciada sin permiso de editor ══
reset role;
select set_config('request.jwt.claims', '{"role":"authenticated","email":"otra.persona@prueba.cl"}', false);
set role authenticated;
select prueba.da('Sesión sin permiso de editor: ve solo los avisos publicados', 'select count(*)::text from public.avisos', '1');
select prueba.hace('Sesión sin permiso de editor: no puede publicar avisos', $q$insert into public.avisos (titulo, publicado) values ('x', true)$q$, '42501');
select prueba.da('Sesión sin permiso de editor: no cambia avisos', $q$with b as (update public.avisos set titulo = 'x' returning 1) select count(*)::text from b$q$, '0');
select prueba.da('Sesión sin permiso de editor: no borra avisos', $q$with b as (delete from public.avisos returning 1) select count(*)::text from b$q$, '0');
select prueba.da('Sesión sin permiso de editor: no ve a los editores', 'select count(*)::text from public.editores', '0');
select prueba.hace('Sesión sin permiso de editor: no puede publicar evaluaciones', $q$insert into public.evaluaciones (jornada, fecha, asignatura) values ('tech', current_date, 'x')$q$, '42501');
select prueba.hace('Sesión sin permiso de editor: no puede subir archivos', $q$insert into storage.objects (bucket_id, name) values ('documentos', 'x.pdf')$q$, '42501');
select prueba.da('Sesión sin permiso de editor: no ve ni borra archivos', $q$with b as (delete from storage.objects returning 1) select count(*)::text from b$q$, '0');
select prueba.hace('Sesión iniciada: no escribe en las consultas (la app pública va siempre como visitante)', $q$insert into public.consultas (pregunta) values ('Consulta con sesión')$q$, '42501');

-- ══ Editora (su correo está en la tabla editores) ══
reset role;
select set_config('request.jwt.claims', '{"role":"authenticated","email":"editora@prueba.cl"}', false);
set role authenticated;
select prueba.da('Editora: ve también los borradores', 'select count(*)::text from public.avisos', '2');
select prueba.da('Editora: ve su propio registro de editor', 'select email from public.editores', 'editora@prueba.cl');
select prueba.hace('Editora: publica un aviso', $q$insert into public.avisos (titulo, texto, publicado, doc_url) values ('Aviso nuevo', 'Texto', true, 'https://ejemplo.supabase.co/storage/v1/object/public/documentos/avisos/nuevo.pdf')$q$);
select prueba.da('Editora: el aviso queda a su nombre', $q$select creado_por from public.avisos where titulo = 'Aviso nuevo'$q$, 'editora@prueba.cl');
select prueba.hace('Editora: edita un aviso', $q$update public.avisos set texto = 'Texto corregido', creado_por = 'otra.persona@prueba.cl' where titulo = 'Aviso nuevo'$q$);
select prueba.da('Editora: al editar, el aviso conserva a quien lo creó', $q$select creado_por from public.avisos where titulo = 'Aviso nuevo'$q$, 'editora@prueba.cl');
select prueba.da('Editora: el panel encuentra otros avisos con el mismo archivo', $q$select count(*)::text from public.avisos where doc_url = 'https://ejemplo.supabase.co/storage/v1/object/public/documentos/avisos/nuevo.pdf'$q$, '1');
select prueba.hace('Editora: publica una evaluación', $q$insert into public.evaluaciones (jornada, fecha, asignatura, seccion) values ('tech', date '2026-11-27', 'Ramo de prueba', 'B') on conflict (jornada, fecha, asignatura, seccion) do update set nota = excluded.nota$q$);
select prueba.hace('Editora: corrige una evaluación publicada (upsert del panel)', $q$insert into public.evaluaciones (jornada, fecha, asignatura, seccion, nota) values ('tech', date '2026-11-27', 'Ramo de prueba', 'B', 'Sala cambiada') on conflict (jornada, fecha, asignatura, seccion) do update set nota = excluded.nota$q$);
select prueba.hace('Editora: una evaluación con jornada desconocida se rechaza', $q$insert into public.evaluaciones (jornada, fecha, asignatura) values ('nocturna', current_date, 'x')$q$, '23514');
select prueba.hace('Editora: no puede vaciar tablas', 'truncate public.avisos', '42501');
select prueba.hace('Editora: no lee las consultas desde la API', 'select * from public.consultas', '42501');
select prueba.hace('Editora: sube un archivo al depósito', $q$insert into storage.objects (bucket_id, name) values ('documentos', 'avisos/nuevo.pdf')$q$);
select prueba.da('Editora: ve los archivos del depósito «documentos»', $q$select count(*)::text from storage.objects where bucket_id = 'documentos'$q$, '2');
select prueba.da('Editora: no ve otros depósitos', $q$select count(*)::text from storage.objects where bucket_id = 'otro'$q$, '0');
select prueba.hace('Editora: no sube archivos a otros depósitos', $q$insert into storage.objects (bucket_id, name) values ('otro', 'x.pdf')$q$, '42501');
select prueba.da('Editora: borra un archivo del depósito (como lo pide el panel)', $q$with b as (delete from storage.objects where bucket_id = 'documentos' and name = 'avisos/nuevo.pdf' returning 1) select count(*)::text from b$q$, '1');
select prueba.da('Editora: no borra archivos de otros depósitos', $q$with b as (delete from storage.objects where bucket_id = 'otro' returning 1) select count(*)::text from b$q$, '0');
select prueba.hace('Editora: borra un aviso', $q$delete from public.avisos where titulo = 'Aviso nuevo'$q$);
select prueba.da('Editora: el aviso borrado ya no está', $q$select count(*)::text from public.avisos where titulo = 'Aviso nuevo'$q$, '0');

-- ══ Estructura ══
reset role;
select set_config('request.jwt.claims', '', false);
select prueba.da('Todas las tablas tienen RLS activado',
  $q$select coalesce(string_agg(c.relname, ', '), '') from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity$q$, '');
select prueba.da('Ninguna tabla da a la API permisos de vaciar, referenciar, disparadores ni mantenimiento',
  $q$select coalesce(string_agg(distinct c.relname || ' (' || lower(a.privilege_type) || ')', ', '), '')
     from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join lateral aclexplode(c.relacl) a
     where n.nspname = 'public' and c.relkind = 'r' and a.grantee in ('anon'::regrole, 'authenticated'::regrole)
       and a.privilege_type not in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')$q$, '');
select prueba.da('Desde la API solo se llaman las funciones del modo en vivo',
  $q$select string_agg(p.proname, ', ' order by p.proname) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute'))$q$,
  'vivo_crear, vivo_estado, vivo_mover, vivo_responder, vivo_resultados');
-- rls_auto_enable solo usa nombres completos (esquema.tabla), así que le basta pg_catalog
select prueba.da('Las funciones con permisos de su dueño tienen la ruta de búsqueda fija, terminada en pg_temp',
  $q$select coalesce(string_agg(p.proname, ', ' order by p.proname), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef and p.proname <> 'rls_auto_enable'
       and not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%pg\_temp')$q$, '');
select prueba.da('El depósito «documentos» es público, de hasta 20 MB y no acepta HTML ni SVG',
  $q$select (public and file_size_limit = 20971520 and not (allowed_mime_types && array['text/html', 'image/svg+xml']))::text
     from storage.buckets where id = 'documentos'$q$, 'true');
select prueba.da('La limpieza diaria del modo en vivo está programada', $q$select schedule from cron.job where jobname = 'uapp-vivo-limpieza'$q$, '17 7 * * *');
select prueba.hace('La limpieza diaria del modo en vivo funciona', (select command from cron.job where jobname = 'uapp-vivo-limpieza'));

-- Una tabla nueva queda cerrada: RLS se activa sola (disparador de eventos) y la API no recibe permisos
create table public.prueba_tabla_nueva (id int);
select prueba.da('Tabla nueva: RLS se activa solo', $q$select relrowsecurity::text from pg_class where oid = 'public.prueba_tabla_nueva'::regclass$q$, 'true');
select prueba.da('Tabla nueva: la API no recibe ningún permiso',
  $q$select count(*)::text from pg_class c cross join lateral aclexplode(c.relacl) a
     where c.oid = 'public.prueba_tabla_nueva'::regclass and a.grantee in ('anon'::regrole, 'authenticated'::regrole)$q$, '0');
drop table public.prueba_tabla_nueva;
