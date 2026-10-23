-- USCupo · franjas con hora libre.
-- El estudiante ya no elige de una grilla fija: escribe día(s), hora de inicio y de fin.
-- Cada combinación distinta se guarda una sola vez en bloques_horario (unique dias+horas),
-- así dos estudiantes que escriben la misma franja comparten id y el match sigue siendo
-- una comparación de ids.

create or replace function bloque_para_franja(p_dias text[], p_inicio time, p_fin time)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para publicar';
  end if;
  if coalesce(array_length(p_dias, 1), 0) = 0 then
    raise exception 'Elige al menos un día';
  end if;
  if exists (
    select 1 from unnest(p_dias) d
    where d not in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')
  ) then
    raise exception 'Día no válido';
  end if;
  if p_fin <= p_inicio then
    raise exception 'La hora final debe ser después de la inicial';
  end if;

  insert into bloques_horario (dias, hora_inicio, hora_fin, etiqueta)
  values (
    p_dias,
    p_inicio,
    p_fin,
    array_to_string(p_dias, ' y ') || ' · ' ||
      (case
        when p_inicio = '12:00' then '12:00 m.'
        else replace(replace(to_char(p_inicio, 'HH12:MI AM'), 'AM', 'a.m.'), 'PM', 'p.m.')
      end) ||
      ' – ' ||
      (case
        when p_fin = '12:00' then '12:00 m.'
        else replace(replace(to_char(p_fin, 'HH12:MI AM'), 'AM', 'a.m.'), 'PM', 'p.m.')
      end)
  )
  on conflict (dias, hora_inicio, hora_fin) do nothing;

  select id into v_id
  from bloques_horario
  where dias = p_dias and hora_inicio = p_inicio and hora_fin = p_fin;
  return v_id;
end;
$$;

revoke all on function bloque_para_franja(text[], time, time) from public;
grant execute on function bloque_para_franja(text[], time, time) to authenticated;
