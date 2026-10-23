import { supabase } from '../lib/supabase';
import type { BloqueHorario, Materia } from './types';

export async function listarMateriasDeCarrera(carreraId: number): Promise<Materia[]> {
  const { data, error } = await supabase
    .from('materias')
    .select('*')
    .eq('carrera_id', carreraId)
    .order('semestre', { nullsFirst: false })
    .order('nombre');
  if (error) throw error;
  return data as Materia[];
}

export async function listarBloques(): Promise<BloqueHorario[]> {
  const { data, error } = await supabase.from('bloques_horario').select('*').order('id');
  if (error) throw error;
  return data as BloqueHorario[];
}

// ── Presentación de franjas ──────────────────────────────────────────────────────

export const PATRONES_DIAS = [
  ['Lunes'],
  ['Martes'],
  ['Miércoles'],
  ['Jueves'],
  ['Viernes'],
  ['Sábado'],
  ['Lunes', 'Miércoles'],
  ['Martes', 'Jueves'],
] as const;

export const diasClave = (dias: readonly string[]) => dias.join(' y ');

const ABREV: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
};

export function diasCortos(dias: readonly string[]): string {
  return dias.map((d) => ABREV[d] ?? d).join(' y ');
}

/** "08:00:00" → "8:00 a.m." */
export function hora12(hhmmss: string): string {
  const [h, m] = hhmmss.split(':').map(Number);
  if (h === 12 && m === 0) return '12:00 m.';
  const sufijo = h < 12 ? 'a.m.' : 'p.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`;
}

export function rangoHoras(b: Pick<BloqueHorario, 'hora_inicio' | 'hora_fin'>): string {
  return `${hora12(b.hora_inicio)} – ${hora12(b.hora_fin)}`;
}

export function etiquetaCorta(b: BloqueHorario): string {
  return `${diasCortos(b.dias)} · ${rangoHoras(b)}`;
}
