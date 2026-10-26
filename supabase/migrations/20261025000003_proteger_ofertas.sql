-- USCupo · el cliente no puede inventar un interesado ni cambiar su correo por uno ajeno.
--
-- ofertas_update_dueno y ofertas_insert_propia dejan escribir cualquier columna de la fila
-- propia. Un estudiante podía crear o editar su oferta con interesado_id = el id de otro
-- (los ids se ven en perfiles_publicos) y estado 'en_proceso', y luego contacto_revelado() le
-- entregaba el correo y el WhatsApp de esa persona. El interesado solo lo pone
-- expresar_interes() y lo quita liberar_oferta() o el dueño al liberarla.
--
-- Igual que privado.proteger_rol(): solo actúa sobre escrituras directas del cliente
-- (current_user anon/authenticated). Las funciones security definer y el SQL Editor no cambian.

create or replace function privado.proteger_oferta()
returns trigger
language plpgsql
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Una oferta nueva siempre nace disponible y sin interesado.
    new.estado := 'disponible';
    new.interesado_id := null;
    new.interesado_at := null;
    new.resuelta_at := null;
    return new;
  end if;

  if new.interesado_id is not null and new.interesado_id is distinct from old.interesado_id then
    raise exception 'No puedes asignar un interesado a tu oferta';
  end if;
  -- El estado lo mueven las funciones (expresar_interes, confirmar_cambio, liberar_oferta, el
  -- cron de expiración). Desde el cliente el dueño solo puede liberar una oferta en proceso
  -- (vuelve a disponible sin interesado); cualquier otro cambio de estado se rechaza.
  if new.estado is distinct from old.estado
     and not (old.estado = 'en_proceso' and new.estado = 'disponible') then
    raise exception 'No puedes cambiar el estado de la oferta así';
  end if;
  if new.estado = 'disponible' and new.interesado_id is not null then
    raise exception 'Una oferta disponible no puede tener interesado';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_oferta on public.ofertas;
create trigger proteger_oferta
  before insert or update on public.ofertas
  for each row execute function privado.proteger_oferta();

-- El correo del perfil es el que contacto_revelado() le da a la contraparte: desde el cliente
-- (al crear o editar el perfil) solo puede quedar igual o ser el de la propia sesión.
create or replace function privado.proteger_correo()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (tg_op = 'INSERT' or new.correo is distinct from old.correo)
     and lower(new.correo) is distinct from lower(auth.jwt() ->> 'email') then
    raise exception 'El correo del perfil es el de tu cuenta y no se puede cambiar';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_correo on public.profiles;
create trigger proteger_correo
  before insert or update on public.profiles
  for each row execute function privado.proteger_correo();

revoke all on function privado.proteger_oferta() from public, anon, authenticated;
revoke all on function privado.proteger_correo() from public, anon, authenticated;
