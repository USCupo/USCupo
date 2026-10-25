-- USCupo · arenero sin consultas repetidas.
--
-- 20261024000005 llama a privado.dueno_visible(user_id) por cada oferta candidata, y esa función
-- vuelve a leer en profiles el rol de quien consulta en cada fila. Aquí el rol del que consulta se
-- resuelve una sola vez por consulta (subconsulta escalar = initplan) y por fila solo se mira el del
-- dueño. Mismas reglas de visibilidad; solo cambia el costo.

-- Rol del que consulta (true = cuenta de revisión o demo).
create or replace function privado.soy_cuenta_prueba()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select privado.es_cuenta_prueba(auth.uid());
$$;

revoke all on function privado.soy_cuenta_prueba() from public, anon;
grant execute on function privado.soy_cuenta_prueba() to authenticated;

drop policy if exists "ofertas_select" on public.ofertas;
create policy "ofertas_select" on public.ofertas for select to authenticated
  using (
    user_id = auth.uid()
    or interesado_id = auth.uid()
    or (
      estado in ('disponible', 'en_proceso')
      and privado.es_cuenta_prueba(user_id) = (select privado.soy_cuenta_prueba())
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
    and privado.es_cuenta_prueba(o.user_id) = (select privado.soy_cuenta_prueba())
    and not privado.oferta_oculta_para_mi(o.id)
    and not privado.hay_bloqueo(auth.uid(), o.user_id)
    and exists (
      select 1 from ofertas_busco ob
      where ob.oferta_id = o.id and ob.bloque_id = p_mi_bloque_actual
    );
$$;

revoke all on function public.buscar_matches(bigint, bigint, bigint[]) from public, anon;
grant execute on function public.buscar_matches(bigint, bigint, bigint[]) to authenticated;
