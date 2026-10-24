import { supabase } from '../lib/supabase';
import type { ClaveMotivo } from '../controllers/estadoModeracion';

// Contenido generado por usuarios: reportar ofertas y bloquear estudiantes. Todo pasa por RPC;
// las tablas no se leen desde el cliente y la RLS ya oculta lo reportado y lo bloqueado
// (migración 20261024000002).

export interface UsuarioBloqueado {
  usuario_id: string;
  nombre_completo: string;
}

export async function reportarOferta(ofertaId: number, motivo: ClaveMotivo, detalle: string): Promise<void> {
  const { error } = await supabase.rpc('reportar_oferta', {
    p_oferta_id: ofertaId,
    p_motivo: motivo,
    p_detalle: detalle.trim() || null,
  });
  if (error) throw error;
}

export async function bloquearUsuario(usuarioId: string): Promise<void> {
  const { error } = await supabase.rpc('bloquear_usuario', { p_usuario_id: usuarioId });
  if (error) throw error;
}

export async function desbloquearUsuario(usuarioId: string): Promise<void> {
  const { error } = await supabase.rpc('desbloquear_usuario', { p_usuario_id: usuarioId });
  if (error) throw error;
}

export async function listarBloqueados(): Promise<UsuarioBloqueado[]> {
  const { data, error } = await supabase.rpc('mis_bloqueados');
  if (error) throw error;
  return (data ?? []) as UsuarioBloqueado[];
}
