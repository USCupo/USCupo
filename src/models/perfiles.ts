import { supabase } from '../lib/supabase';
import { VERSION_LEGAL } from './legal';
import type { Profile } from './types';

export async function obtenerPerfilPropio(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function actualizarPerfilPropio(
  userId: string,
  cambios: Partial<
    Pick<Profile, 'nombre_completo' | 'carrera_id' | 'whatsapp' | 'mostrar_correo' | 'mostrar_whatsapp'>
  >
): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').update(cambios).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as Profile;
}

// Registra que aceptó términos y política en la versión vigente; la hora la pone el servidor.
export async function aceptarLegal(): Promise<void> {
  const { error } = await supabase.rpc('aceptar_legal', { p_version: VERSION_LEGAL });
  if (error) throw error;
}

// Borra la cuenta y todo lo suyo (perfil, ofertas, avisos). No se puede deshacer.
export async function eliminarMiCuenta(): Promise<void> {
  const { error } = await supabase.rpc('eliminar_mi_cuenta');
  if (error) throw error;
}

// Ley 1581: sin aceptar la versión vigente no se entra (la autorización va antes de tratar datos).
export function legalVigente(perfil: Profile | null): boolean {
  return perfil?.legal_version === VERSION_LEGAL;
}

// Un perfil está completo cuando tiene carrera: las cuentas que entran con Microsoft
// llegan sin ella y la eligen en "Completa tu perfil".
export function perfilCompleto(perfil: Profile | null): boolean {
  return !!perfil?.carrera_id;
}
