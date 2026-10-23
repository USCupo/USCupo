-- USCupo · alta de perfil para cuentas Microsoft 365 de la USC (proveedor azure).
-- Microsoft no envía nombre_completo ni carrera_id: el nombre viene en full_name / name y
-- la carrera queda null hasta que el estudiante la elige en "Completa tu perfil".
-- La verificación del dominio @usc.edu.co no cambia.
--
-- Defensa en profundidad para Azure: el claim de correo de Microsoft no siempre está
-- verificado (un tenant ajeno podría declarar "alguien@usc.edu.co"). Además de fijar el
-- Tenant URL de la USC en el proveedor, aquí se exige que la cuenta venga del tenant de
-- la USC (tid / iss). Si no hay forma de comprobarlo, se rechaza (falla cerrado).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  usc_tenant constant text := '47e962fd-bc3b-4eed-b1b8-d70eee9acd65';
  tenant_cuenta text;
begin
  if new.email is null or new.email !~* '^[^@]+@usc\.edu\.co$' then
    raise exception 'USCupo es solo para correos institucionales @usc.edu.co';
  end if;

  if new.raw_app_meta_data ->> 'provider' = 'azure' then
    tenant_cuenta := coalesce(
      new.raw_user_meta_data -> 'custom_claims' ->> 'tid',
      substring(new.raw_user_meta_data ->> 'iss' from 'login\.microsoftonline\.com/([0-9a-fA-F-]{36})')
    );
    if tenant_cuenta is null or lower(tenant_cuenta) <> usc_tenant then
      raise exception 'USCupo es solo para correos institucionales @usc.edu.co';
    end if;
  end if;

  insert into public.profiles (id, nombre_completo, correo, carrera_id)
    values (
      new.id,
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'nombre_completo'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
        nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(new.email, '@', 1)
      ),
      lower(new.email),
      nullif(new.raw_user_meta_data ->> 'carrera_id', '')::bigint
    );

  return new;
end;
$$;
