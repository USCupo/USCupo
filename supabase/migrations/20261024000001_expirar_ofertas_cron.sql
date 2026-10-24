-- USCupo · Expiración automática de ofertas en proceso.
-- Si nadie confirma el cambio dentro de los 7 días siguientes a que alguien mostró interés
-- (expires_at), la oferta pasa a 'expirada' y el dueño recibe el aviso 'oferta_expirada'.
--
-- Reemplaza a la Edge Function expirar-ofertas, que además borraba la oferta: el borrado se
-- llevaba en cascada el aviso recién creado (notificaciones.oferta_id on delete cascade) y la
-- oferta desaparecía del historial de Perfil, que sí muestra las expiradas.
--
-- Corre en la base con pg_cron cada hora: sin service key, sin URL ni deploy de funciones.

create extension if not exists pg_cron;

create or replace function public.expirar_ofertas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  with vencidas as (
    update public.ofertas
       set estado = 'expirada'
     where estado = 'en_proceso'
       and expires_at < now()
    returning id, user_id
  ), avisos as (
    insert into public.notificaciones (user_id, oferta_id, tipo)
    select user_id, id, 'oferta_expirada' from vencidas
    returning 1
  )
  select count(*) into v_total from avisos;
  return v_total;
end;
$$;

-- Solo la ejecuta el cron (rol postgres); nadie desde la API.
revoke all on function public.expirar_ofertas() from public, anon, authenticated;

-- Idempotente: si el job ya existe, se reprograma con el mismo nombre.
select cron.schedule('expirar-ofertas', '0 * * * *', $$select public.expirar_ofertas()$$);
