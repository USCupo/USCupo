-- USCupo · contacto_revelado: el control de acceso fallaba con NULL.
--
-- `auth.uid() not in (v_dueno, v_interesado)` da NULL (no TRUE) cuando la oferta aún no tiene
-- interesado: `x not in (a, NULL)` nunca es verdadero. El IF no lanzaba la excepción y cualquier
-- estudiante con sesión recibía el correo y el WhatsApp del dueño de una oferta disponible.
-- Ahora solo pasan el dueño o el interesado, comparados con IS DISTINCT FROM (seguro con NULL),
-- y nunca sin sesión. Mismo contrato: misma firma y mismas columnas.

create or replace function contacto_revelado(p_oferta_id bigint)
returns table (
  perfil_id uuid,
  nombre_completo text,
  correo text,
  whatsapp text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yo uuid := auth.uid();
  v_dueno uuid;
  v_interesado uuid;
  v_otro uuid;
begin
  select user_id, interesado_id into v_dueno, v_interesado from ofertas where id = p_oferta_id;

  if v_dueno is null then
    raise exception 'Oferta no encontrada';
  end if;
  if v_yo is null or (v_yo is distinct from v_dueno and v_yo is distinct from v_interesado) then
    raise exception 'No tienes acceso al contacto de esta oferta';
  end if;

  v_otro := case when v_yo = v_dueno then v_interesado else v_dueno end;
  if v_otro is null then
    raise exception 'Todavía no hay un interesado en esta oferta';
  end if;

  return query
    select p.id, p.nombre_completo,
           case when p.mostrar_correo then p.correo else null end,
           case when p.mostrar_whatsapp then p.whatsapp else null end
    from profiles p
    where p.id = v_otro;
end;
$$;

revoke all on function contacto_revelado(bigint) from public, anon;
grant execute on function contacto_revelado(bigint) to authenticated;
