-- USCupo · la vista perfiles_publicos debe mostrar el nombre y la carrera de CUALQUIER
-- estudiante autenticado (es lo que se ve en el feed de ofertas).
--
-- Con security_invoker = true la vista heredaba la RLS de profiles ("cada quien ve solo
-- el suyo") y devolvía vacío para los demás. Pasa a ejecutarse con los permisos del
-- dueño de la vista; sigue exponiendo solo id, nombre_completo y carrera_id (nunca
-- correo ni WhatsApp, que solo salen por contacto_revelado()).

alter view perfiles_publicos set (security_invoker = false);

revoke all on perfiles_publicos from anon;
grant select on perfiles_publicos to authenticated;
