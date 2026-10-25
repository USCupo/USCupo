-- USCupo · rol de cuenta: estudiante, admin o demo.
--
-- 'admin' es la cuenta de revisión (QA, Google Play, App Store): entra a la app con ofertas
-- precargadas. 'demo' son los estudiantes ficticios que le dan contraparte (ofertas ajenas,
-- interesados). Los dos forman un "arenero" aislado en ambos sentidos: los estudiantes reales
-- nunca ven ofertas falsas en Buscar ni en Inicio, y la cuenta de revisión nunca marca interés,
-- recibe avisos ni ve el contacto de un estudiante real.
--
-- El rol no se elige desde el cliente: un trigger impide crearlo o cambiarlo con la sesión de un
-- estudiante (la política perfil_propio_update deja editar la fila propia). Se asigna en el SQL
-- Editor con privado.asignar_rol(correo, rol).

alter table public.profiles
  add column if not exists rol text not null default 'estudiante'
  check (rol in ('estudiante', 'admin', 'demo'));

create or replace function privado.proteger_rol()
returns trigger
language plpgsql
as $$
begin
  -- current_user es el rol de la petición (anon/authenticated) salvo dentro de funciones
  -- security definer o en el SQL Editor (postgres), que sí pueden asignar roles.
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.rol := 'estudiante';
    elsif new.rol is distinct from old.rol then
      raise exception 'No puedes cambiar el rol de tu cuenta';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_rol on public.profiles;
create trigger proteger_rol
  before insert or update on public.profiles
  for each row execute function privado.proteger_rol();

create or replace function privado.es_cuenta_prueba(p_usuario uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = p_usuario and rol in ('admin', 'demo'));
$$;

-- La oferta de p_dueno es visible para quien consulta: cada quien ve solo su lado del arenero.
create or replace function privado.dueno_visible(p_dueno uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select privado.es_cuenta_prueba(p_dueno) = privado.es_cuenta_prueba(auth.uid());
$$;

revoke all on function privado.proteger_rol() from public, anon, authenticated;
revoke all on function privado.es_cuenta_prueba(uuid) from public, anon;
revoke all on function privado.dueno_visible(uuid) from public, anon;
grant execute on function privado.es_cuenta_prueba(uuid) to authenticated;
grant execute on function privado.dueno_visible(uuid) to authenticated;

-- Solo desde el SQL Editor (postgres): select privado.asignar_rol('correo@usc.edu.co', 'admin');
create or replace function privado.asignar_rol(p_correo text, p_rol text)
returns void
language plpgsql
set search_path = public
as $$
begin
  update profiles set rol = p_rol where correo = lower(p_correo);
  if not found then
    raise exception 'No hay un perfil con el correo %', p_correo;
  end if;
end;
$$;

revoke all on function privado.asignar_rol(text, text) from public, anon, authenticated;

-- ── Visibilidad: mismas reglas que 20261024000003 + el arenero ─────────────────────────

drop policy if exists "ofertas_select" on public.ofertas;
create policy "ofertas_select" on public.ofertas for select to authenticated
  using (
    user_id = auth.uid()
    or interesado_id = auth.uid()
    or (
      estado in ('disponible', 'en_proceso')
      and privado.dueno_visible(user_id)
      and not privado.oferta_oculta_para_mi(id)
      and not privado.hay_bloqueo(auth.uid(), user_id)
    )
  );

create or replace function public.buscar_matches(p_materia_id bigint, p_mi_bloque_actual bigint, p_mis_bloques_busco bigint[])
returns setof public.ofertas
language sql
security definer
set search_path = public
stable
as $$
  select o.*
  from ofertas o
  where o.materia_id = p_materia_id
    and o.estado = 'disponible'
    and o.user_id <> auth.uid()
    and o.bloque_actual_id = any(p_mis_bloques_busco)
    and privado.dueno_visible(o.user_id)
    and not privado.oferta_oculta_para_mi(o.id)
    and not privado.hay_bloqueo(auth.uid(), o.user_id)
    and exists (
      select 1 from ofertas_busco ob
      where ob.oferta_id = o.id and ob.bloque_id = p_mi_bloque_actual
    );
$$;

create or replace function public.expresar_interes(p_oferta_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dueno uuid;
  v_estado oferta_estado;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para marcar interés';
  end if;

  select user_id, estado into v_dueno, v_estado from ofertas where id = p_oferta_id for update;

  if v_dueno is null then
    raise exception 'Oferta no encontrada';
  end if;
  if v_dueno = auth.uid() then
    raise exception 'No puedes marcar interés en tu propia oferta';
  end if;
  if v_estado <> 'disponible'
     or not privado.dueno_visible(v_dueno)
     or privado.oferta_oculta_para_mi(p_oferta_id)
     or privado.hay_bloqueo(auth.uid(), v_dueno) then
    raise exception 'Esta oferta ya no está disponible';
  end if;

  update ofertas
    set estado = 'en_proceso',
        interesado_id = auth.uid(),
        interesado_at = now(),
        expires_at = now() + interval '7 days'
    where id = p_oferta_id;

  insert into notificaciones (user_id, oferta_id, tipo)
    values (v_dueno, p_oferta_id, 'interes_recibido');
end;
$$;

revoke all on function public.buscar_matches(bigint, bigint, bigint[]) from public, anon;
revoke all on function public.expresar_interes(bigint) from public, anon;
grant execute on function public.buscar_matches(bigint, bigint, bigint[]) to authenticated;
grant execute on function public.expresar_interes(bigint) to authenticated;
