-- UApp · Modo en vivo para ayudantías (v2.8)
-- Dos tablas sin datos personales: las salas y las respuestas (cada teléfono es un código al azar, sin nombre).
-- Las tablas no se leen ni se escriben directo desde la app: solo con las cinco funciones de abajo,
-- que revisan cada dato. Las salas se borran solas al día siguiente.
-- Se ejecuta una vez en el editor SQL de Supabase. Volver a ejecutarlo no borra nada.

create table if not exists public.vivo_salas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  clave text not null,
  mazo text not null,
  preguntas text[] not null,
  ordenes text[] not null,
  actual int not null default -1,
  fase text not null default 'espera' check (fase in ('espera','pregunta','respuesta','fin')),
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now()
);

create table if not exists public.vivo_respuestas (
  sala uuid not null references public.vivo_salas(id) on delete cascade,
  pregunta int not null,
  participante text not null,
  opcion int not null check (opcion between 0 and 5),
  creada timestamptz not null default now(),
  primary key (sala, pregunta, participante)
);

alter table public.vivo_salas enable row level security;
alter table public.vivo_respuestas enable row level security;
revoke all on public.vivo_salas, public.vivo_respuestas from anon, authenticated;

-- Crear una sala: devuelve el código para el curso y la clave secreta de quien dirige.
create or replace function public.vivo_crear(p_mazo text, p_preguntas text[], p_ordenes text[])
returns table(codigo text, clave text)
language plpgsql security definer set search_path = public as $$
declare
  v_codigo text;
  v_clave text;
  intento int := 0;
  k int;
begin
  if p_mazo is null or p_mazo !~ '^[a-z0-9-]{1,60}$'
     or coalesce(array_length(p_preguntas, 1), 0) not between 1 and 30
     or coalesce(array_length(p_ordenes, 1), 0) <> coalesce(array_length(p_preguntas, 1), 0) then
    raise exception 'Datos de la sala no válidos';
  end if;
  delete from vivo_salas where creada < now() - interval '1 day';
  loop
    v_codigo := '';
    for k in 1..5 loop
      v_codigo := v_codigo || substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1);
    end loop;
    exit when not exists (select 1 from vivo_salas s where s.codigo = v_codigo);
    intento := intento + 1;
    if intento > 20 then raise exception 'No hay códigos disponibles'; end if;
  end loop;
  v_clave := replace(gen_random_uuid()::text, '-', '');
  insert into vivo_salas (codigo, clave, mazo, preguntas, ordenes) values (v_codigo, v_clave, p_mazo, p_preguntas, p_ordenes);
  return query select v_codigo, v_clave;
end $$;

-- Estado público de una sala (sin la clave): ramo, preguntas, pregunta en curso y cuántos respondieron.
create or replace function public.vivo_estado(p_codigo text)
returns table(mazo text, preguntas text[], ordenes text[], actual int, fase text, respuestas int)
language sql security definer set search_path = public stable as $$
  select s.mazo, s.preguntas, s.ordenes, s.actual, s.fase,
         (select count(*)::int from vivo_respuestas r where r.sala = s.id and r.pregunta = s.actual)
  from vivo_salas s
  where s.codigo = upper(p_codigo) and s.creada > now() - interval '1 day';
$$;

-- Avanzar la sala: solo quien tiene la clave.
create or replace function public.vivo_mover(p_codigo text, p_clave text, p_actual int, p_fase text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_fase not in ('espera','pregunta','respuesta','fin') then return false; end if;
  update vivo_salas set actual = p_actual, fase = p_fase, actualizada = now()
   where codigo = upper(p_codigo) and clave = p_clave
     and p_actual between -1 and coalesce(array_length(preguntas, 1), 0);
  return found;
end $$;

-- Responder: solo mientras esa pregunta está abierta; cada teléfono tiene una respuesta por pregunta (puede cambiarla).
create or replace function public.vivo_responder(p_codigo text, p_participante text, p_pregunta int, p_opcion int)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_participante !~ '^[a-f0-9]{8,64}$' or p_opcion not between 0 and 5 then return false; end if;
  select id into v_id from vivo_salas
   where codigo = upper(p_codigo) and fase = 'pregunta' and actual = p_pregunta;
  if v_id is null then return false; end if;
  insert into vivo_respuestas (sala, pregunta, participante, opcion) values (v_id, p_pregunta, p_participante, p_opcion)
  on conflict (sala, pregunta, participante) do update set opcion = excluded.opcion, creada = now();
  return true;
end $$;

-- Cuántos eligieron cada alternativa en una pregunta.
create or replace function public.vivo_resultados(p_codigo text, p_pregunta int)
returns table(opcion int, n int)
language sql security definer set search_path = public stable as $$
  select r.opcion, count(*)::int
  from vivo_respuestas r join vivo_salas s on s.id = r.sala
  where s.codigo = upper(p_codigo) and r.pregunta = p_pregunta
  group by r.opcion;
$$;

revoke all on function public.vivo_crear(text, text[], text[]) from public;
revoke all on function public.vivo_estado(text) from public;
revoke all on function public.vivo_mover(text, text, int, text) from public;
revoke all on function public.vivo_responder(text, text, int, int) from public;
revoke all on function public.vivo_resultados(text, int) from public;
grant execute on function public.vivo_crear(text, text[], text[]) to anon, authenticated;
grant execute on function public.vivo_estado(text) to anon, authenticated;
grant execute on function public.vivo_mover(text, text, int, text) to anon, authenticated;
grant execute on function public.vivo_responder(text, text, int, int) to anon, authenticated;
grant execute on function public.vivo_resultados(text, int) to anon, authenticated;

-- Limpieza diaria (opcional, se ejecuta aparte): borra cada madrugada las salas de más de un día y,
-- con ellas, sus respuestas. Sin esto, las salas viejas dejan de verse al día siguiente pero se borran
-- recién cuando alguien crea otra sala. Usa la extensión pg_cron de Supabase.
-- create extension if not exists pg_cron with schema pg_catalog;
-- select cron.schedule('uapp-vivo-limpieza', '17 7 * * *',
--   $$delete from public.vivo_salas where creada < now() - interval '1 day'$$);
