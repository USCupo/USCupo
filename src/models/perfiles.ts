import { supabase } from '../lib/supabase';
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

// Un perfil está completo cuando tiene carrera: las cuentas que entran con Microsoft
// llegan sin ella y la eligen en "Completa tu perfil".
export function perfilCompleto(perfil: Profile | null): boolean {
  return !!perfil?.carrera_id;
}
