-- Liberar como RPC (parte B1 de USCupoAndroid/docs/propuestas/2026-10-23-seguridad-rls.sql): la
-- transición en_proceso → disponible la valida el servidor, no el cliente.
--
-- PENDIENTE (B2, coordinado con Android e iOS): cuando todas las apps publicadas liberen con esta
-- RPC, quitar insert/update de `ofertas` al rol authenticated (ver la propuesta). Aplicarlo antes
-- rompería la app Android publicada, que todavía libera con update.

create or replace function liberar_oferta(p_oferta_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para liberar tu oferta';
  end if;

  update ofertas
    set estado = 'disponible', interesado_id = null, interesado_at = null, expires_at = null
    where id = p_oferta_id and user_id = auth.uid() and estado = 'en_proceso';

  if not found then
    raise exception 'Esta oferta ya no está en proceso. Actualizamos la lista.';
  end if;
end;
$$;

revoke all on function liberar_oferta(bigint) from public, anon;
grant execute on function liberar_oferta(bigint) to authenticated;
