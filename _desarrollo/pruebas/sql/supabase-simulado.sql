-- UApp · Lo mínimo de Supabase para cargar _desarrollo/esquema.sql en un PostgreSQL vacío (lo usa correr.sh).
-- No es Supabase: imita solo lo que el esquema y las pruebas necesitan.
--   · los roles de la API: anon (visitante), authenticated (sesión iniciada) y service_role (salta RLS);
--   · auth.jwt(): en Supabase lee el token de quien consulta; aquí, el ajuste request.jwt.claims
--     (las pruebas lo cambian para hacerse pasar por un visitante, otra persona o un editor);
--   · storage.buckets y storage.objects con RLS y todos los permisos de tabla, como el depósito de archivos;
--   · cron.job y cron.schedule(), como pg_cron;
--   · los permisos por defecto de las tablas nuevas que trae Supabase (los mismos de producción).

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;

-- Supabase da a las tablas nuevas estos permisos (producción, 31 de octubre de 2026; «maintain» existe desde PostgreSQL 17)
alter default privileges for role postgres in schema public grant all on tables to postgres;
alter default privileges for role postgres in schema public grant all on sequences to postgres;
alter default privileges for role postgres in schema public grant all on functions to postgres;
do $$ begin
  if current_setting('server_version_num')::int >= 170000 then
    execute 'alter default privileges for role postgres in schema public grant truncate, references, trigger, maintain on tables to anon, authenticated, service_role';
  else
    execute 'alter default privileges for role postgres in schema public grant truncate, references, trigger on tables to anon, authenticated, service_role';
  end if;
end $$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid
$$;
grant execute on all functions in schema auth to anon, authenticated, service_role;

create schema if not exists storage;
grant usage on schema storage to anon, authenticated, service_role;
create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid default auth.uid(),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (bucket_id, name)
);
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;

create schema if not exists cron;
create table if not exists cron.job (
  jobid bigserial primary key,
  schedule text not null,
  command text not null,
  jobname text unique
);
create or replace function cron.schedule(job_name text, schedule text, command text) returns bigint
language sql as $$
  insert into cron.job (jobname, schedule, command) values (job_name, schedule, command)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command
  returning jobid
$$;
