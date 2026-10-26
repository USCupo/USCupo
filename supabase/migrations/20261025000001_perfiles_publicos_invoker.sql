-- USCupo · perfiles_publicos sin SECURITY DEFINER (aviso "Security Definer View" de Supabase).
--
-- La vista se ejecutaba con los permisos de su dueño para saltarse la RLS de profiles ("cada
-- quien ve solo el suyo") y mostrar el nombre y la carrera de los demás en el feed. Ahora la
-- vista corre con los permisos de quien consulta (security_invoker) y lee de una función
-- security definer en el esquema privado, que PostgREST no publica y que devuelve solo
-- id, nombre_completo y carrera_id (nunca correo ni WhatsApp, que siguen saliendo solo por
-- contacto_revelado()). La API no cambia: web y apps siguen leyendo perfiles_publicos.

create or replace function privado.perfiles_publicos()
returns table (id uuid, nombre_completo text, carrera_id bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.nombre_completo, p.carrera_id from profiles p;
$$;

revoke all on function privado.perfiles_publicos() from public, anon;
grant execute on function privado.perfiles_publicos() to authenticated;

create or replace view perfiles_publicos with (security_invoker = true) as
  select id, nombre_completo, carrera_id from privado.perfiles_publicos();

revoke all on perfiles_publicos from anon;
grant select on perfiles_publicos to authenticated;
