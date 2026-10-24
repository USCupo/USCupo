-- USCupo · Las ayudas de la RLS de moderación salen de la API.
--
-- hay_bloqueo(a, b) y oferta_oculta_para_mi(id) estaban en el esquema public con EXECUTE para
-- authenticated: PostgREST las expone como RPC y cualquier estudiante podía preguntar si X bloqueó
-- a Y (el bloqueo debe ser invisible) o si una oferta acumula reportes. Pasan al esquema privado,
-- que PostgREST no publica; las políticas y las RPC security definer las siguen usando.

create schema if not exists privado;
revoke all on schema privado from public, anon;
-- La RLS evalúa las funciones con el rol de quien consulta: necesita USAGE y EXECUTE.
grant usage on schema privado to authenticated;

create or replace function privado.hay_bloqueo(p_a uuid, p_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from bloqueos
     where (bloqueador_id = p_a and bloqueado_id = p_b)
        or (bloqueador_id = p_b and bloqueado_id = p_a)
  );
$$;

create or replace function privado.oferta_oculta_para_mi(p_oferta_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from reportes where oferta_id = p_oferta_id and autor_id = auth.uid())
      or (select count(*) from reportes where oferta_id = p_oferta_id and estado = 'pendiente') >= 3;
$$;

revoke all on function privado.hay_bloqueo(uuid, uuid) from public, anon;
revoke all on function privado.oferta_oculta_para_mi(bigint) from public, anon;
grant execute on function privado.hay_bloqueo(uuid, uuid) to authenticated;
grant execute on function privado.oferta_oculta_para_mi(bigint) to authenticated;

drop policy if exists "ofertas_select" on public.ofertas;
create policy "ofertas_select" on public.ofertas for select to authenticated
  using (
    user_id = auth.uid()
    or interesado_id = auth.uid()
    or (
      estado in ('disponible', 'en_proceso')
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
  if v_estado <> 'disponible' or privado.oferta_oculta_para_mi(p_oferta_id) or privado.hay_bloqueo(auth.uid(), v_dueno) then
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

-- Las versiones públicas ya no las usa nada.
drop function if exists public.hay_bloqueo(uuid, uuid);
drop function if exists public.oferta_oculta_para_mi(bigint);
