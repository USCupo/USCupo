import { supabase } from '../lib/supabase';

type TipoNotificacion = 'interes_recibido' | 'cambio_confirmado' | 'oferta_expirada';

export interface Notificacion {
  id: number;
  user_id: string;
  oferta_id: number | null;
  tipo: TipoNotificacion;
  leida: boolean;
  created_at: string;
  oferta: { id: number; grupo: string; materia: { nombre: string } | null } | null;
}

export async function listarNotificaciones(userId: string, limite = 20): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*, oferta:ofertas(id, grupo, materia:materias(nombre))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data as unknown as Notificacion[];
}

export async function marcarLeidas(ids: number[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from('notificaciones').update({ leida: true }).in('id', ids);
  if (error) throw error;
}

export function textoNotificacion(n: Notificacion): string {
  const materia = n.oferta?.materia?.nombre ?? 'una materia';
  switch (n.tipo) {
    case 'interes_recibido':
      return `Alguien quiere tu cupo de ${materia}`;
    case 'cambio_confirmado':
      return `Se confirmó el cambio de ${materia}`;
    case 'oferta_expirada':
      return `Tu oferta de ${materia} expiró sin confirmarse`;
  }
}
