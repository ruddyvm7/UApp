-- UApp · Permisos de la tabla evaluaciones (arreglo del 30 de octubre de 2026)
-- Síntoma: la app y el panel reciben «permission denied for table evaluaciones» (código 42501),
-- así que «Esta semana» no muestra las evaluaciones publicadas y el panel no puede publicarlas.
-- Las políticas ya existen («Lectura publica evaluaciones» y «Editores gestionan evaluaciones»),
-- pero faltan los permisos de tabla para los roles de la API; sin ellos, las políticas nunca se aplican.
-- Ojo con las tablas nuevas: además de sus políticas, necesitan su propio «grant».
-- Se ejecuta una vez en el editor SQL de Supabase. Volver a ejecutarlo no cambia nada.

grant select on public.evaluaciones to anon;
grant select, insert, update, delete on public.evaluaciones to authenticated;

-- Si la columna id usa una secuencia (serial o identity), quien publica también necesita usarla.
do $$
declare s text;
begin
  s := pg_get_serial_sequence('public.evaluaciones', 'id');
  if s is not null then
    execute format('grant usage, select on sequence %s to authenticated', s);
  end if;
end $$;
