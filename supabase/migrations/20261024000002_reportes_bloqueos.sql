-- USCupo · Reportar ofertas y bloquear usuarios (política de contenido generado por usuarios de
-- Google Play y guía 1.2 de Apple: el comentario de una oferta es texto libre de otro estudiante).
--
-- Reglas:
--   · Quien reporta deja de ver la oferta al instante.
--   · Con 3 reportes de personas distintas (no descartados) la oferta se oculta para todos menos
--     su dueño y su interesado, hasta que el moderador la revise.
--   · Bloquear es mutuo e invisible: ninguno ve las ofertas del otro ni puede marcar interés.
--     Si había un cambio en proceso entre los dos, la oferta vuelve a 'disponible'.
--
-- Moderación (Table Editor): la vista reportes_pendientes lista lo que falta revisar.
--   · Reporte infundado → update reportes set estado = 'descartado' where id = …;
--   · Contenido inaceptable → delete from ofertas where id = …;  (los reportes se van en cascada)
--
-- Depende de la PARTE A de 2026-10-23-seguridad-rls.sql (expresar_interes con sesión obligatoria).

-- ── Tablas ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.reportes (
  id bigint generated always as identity primary key,
  oferta_id bigint not null references public.ofertas (id) on delete cascade,
  autor_id uuid not null references public.profiles (id) on delete cascade,
  reportado_id uuid not null references public.profiles (id) on delete cascade,
  motivo text not null check (motivo in ('spam', 'ofensivo', 'datos_personales', 'falso', 'otro')),
  detalle text check (length(detalle) <= 500),
  -- Copia de lo publicado al momento del reporte: el dueño puede editar o borrar después.
  comentario_reportado text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'descartado')),
  created_at timestamptz not null default now(),
  unique (oferta_id, autor_id)
);

create index if not exists reportes_oferta_idx on public.reportes (oferta_id) where estado = 'pendiente';

create table if not exists public.bloqueos (
  bloqueador_id uuid not null references public.profiles (id) on delete cascade,
  bloqueado_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);

create index if not exists bloqueos_bloqueado_idx on public.bloqueos (bloqueado_id);

-- Sin políticas: los clientes no leen ni escriben estas tablas directamente, solo por las RPC.
alter table public.reportes enable row level security;
alter table public.bloqueos enable row level security;
revoke all on public.reportes, public.bloqueos from anon, authenticated;

-- ── Ayudas para la RLS (security definer: leen reportes/bloqueos sin exponerlos) ───────────

create or replace function public.hay_bloqueo(p_a uuid, p_b uuid)
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

create or replace function public.oferta_oculta_para_mi(p_oferta_id bigint)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from reportes where oferta_id = p_oferta_id and autor_id = auth.uid())
      or (select count(*) from reportes where oferta_id = p_oferta_id and estado = 'pendiente') >= 3;
$$;

revoke all on function public.hay_bloqueo(uuid, uuid) from public, anon;
revoke all on function public.oferta_oculta_para_mi(bigint) from public, anon;
grant execute on function public.hay_bloqueo(uuid, uuid) to authenticated;
grant execute on function public.oferta_oculta_para_mi(bigint) to authenticated;

-- ── Visibilidad de ofertas ─────────────────────────────────────────────────────────────────
-- Dueño e interesado siempre la ven (es su conversación). Los demás, solo si está activa, no
-- está oculta por reportes y no hay bloqueo con el dueño.

drop policy if exists "ofertas_select" on public.ofertas;
create policy "ofertas_select" on public.ofertas for select to authenticated
  using (
    user_id = auth.uid()
    or interesado_id = auth.uid()
    or (
      estado in ('disponible', 'en_proceso')
      and not public.oferta_oculta_para_mi(id)
      and not public.hay_bloqueo(auth.uid(), user_id)
    )
  );

-- La subconsulta respeta la RLS de ofertas: los horarios buscados siguen la misma visibilidad.
drop policy if exists "ofertas_busco_select" on public.ofertas_busco;
create policy "ofertas_busco_select" on public.ofertas_busco for select to authenticated
  using (exists (select 1 from public.ofertas o where o.id = oferta_id));

-- ── RPC de dominio que se saltan la RLS: mismos filtros ─────────────────────────────────────

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
    and not oferta_oculta_para_mi(o.id)
    and not hay_bloqueo(auth.uid(), o.user_id)
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
  if v_estado <> 'disponible' or oferta_oculta_para_mi(p_oferta_id) or hay_bloqueo(auth.uid(), v_dueno) then
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

-- ── Reportar ───────────────────────────────────────────────────────────────────────────────

create or replace function public.reportar_oferta(p_oferta_id bigint, p_motivo text, p_detalle text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dueno uuid;
  v_comentario text;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para reportar';
  end if;
  if p_motivo is null or p_motivo not in ('spam', 'ofensivo', 'datos_personales', 'falso', 'otro') then
    raise exception 'Motivo de reporte no válido';
  end if;

  select user_id, comentario into v_dueno, v_comentario from ofertas where id = p_oferta_id;
  if v_dueno is null then
    raise exception 'Oferta no encontrada';
  end if;
  if v_dueno = auth.uid() then
    raise exception 'No puedes reportar tu propia oferta';
  end if;

  insert into reportes (oferta_id, autor_id, reportado_id, motivo, detalle, comentario_reportado)
    values (p_oferta_id, auth.uid(), v_dueno, p_motivo, left(nullif(trim(p_detalle), ''), 500), v_comentario)
    on conflict (oferta_id, autor_id) do nothing;
end;
$$;

revoke all on function public.reportar_oferta(bigint, text, text) from public, anon;
grant execute on function public.reportar_oferta(bigint, text, text) to authenticated;

-- ── Bloquear ───────────────────────────────────────────────────────────────────────────────

create or replace function public.bloquear_usuario(p_usuario_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para bloquear';
  end if;
  if p_usuario_id is null or p_usuario_id = auth.uid() then
    raise exception 'No puedes bloquearte a ti mismo';
  end if;
  if not exists (select 1 from profiles where id = p_usuario_id) then
    raise exception 'Usuario no encontrado';
  end if;

  insert into bloqueos (bloqueador_id, bloqueado_id)
    values (auth.uid(), p_usuario_id)
    on conflict do nothing;

  -- Un cambio en proceso entre los dos se cae: la oferta vuelve a la bolsa (invisible para el otro).
  update ofertas
     set estado = 'disponible', interesado_id = null, interesado_at = null, expires_at = null
   where estado = 'en_proceso'
     and ((user_id = auth.uid() and interesado_id = p_usuario_id)
       or (user_id = p_usuario_id and interesado_id = auth.uid()));
end;
$$;

create or replace function public.desbloquear_usuario(p_usuario_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from bloqueos where bloqueador_id = auth.uid() and bloqueado_id = p_usuario_id;
$$;

-- Para la lista "Usuarios bloqueados" de Perfil.
create or replace function public.mis_bloqueados()
returns table (usuario_id uuid, nombre_completo text, bloqueado_en timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select b.bloqueado_id, p.nombre_completo, b.created_at
    from bloqueos b
    join profiles p on p.id = b.bloqueado_id
   where b.bloqueador_id = auth.uid()
   order by b.created_at desc;
$$;

revoke all on function public.bloquear_usuario(uuid) from public, anon;
revoke all on function public.desbloquear_usuario(uuid) from public, anon;
revoke all on function public.mis_bloqueados() from public, anon;
grant execute on function public.bloquear_usuario(uuid) to authenticated;
grant execute on function public.desbloquear_usuario(uuid) to authenticated;
grant execute on function public.mis_bloqueados() to authenticated;

-- ── Moderación ─────────────────────────────────────────────────────────────────────────────

create or replace view public.reportes_pendientes as
  select r.oferta_id,
         count(*) as reportes,
         string_agg(distinct r.motivo, ', ') as motivos,
         max(r.comentario_reportado) as comentario,
         p.correo as correo_reportado,
         min(r.created_at) as primer_reporte
    from public.reportes r
    join public.profiles p on p.id = r.reportado_id
   where r.estado = 'pendiente'
   group by r.oferta_id, p.correo
   order by count(*) desc, min(r.created_at);

revoke all on public.reportes_pendientes from anon, authenticated;
