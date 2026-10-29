import { supabase } from '../lib/supabase';
import { almacenLocal, crearCacheCatalogo } from './cacheCatalogo';
import type { BloqueHorario, Materia } from './types';

/** Caché del catálogo en localStorage, compartida por carreras, materias y bloques. */
export const cacheCatalogo = crearCacheCatalogo(almacenLocal());
export const alCambiarCatalogo = cacheCatalogo.alCambiar;

export function listarMateriasDeCarrera(carreraId: number): Promise<Materia[]> {
  return cacheCatalogo.leer(`materias-${carreraId}`, async () => {
    const { data, error } = await supabase
      .from('materias')
      .select('*')
      .eq('carrera_id', carreraId)
      .order('semestre', { nullsFirst: false })
      .order('nombre');
    if (error) throw error;
    return data as Materia[];
  });
}

// Cada horario personalizado agrega un bloque, así que la lista casi siempre cambia al
// revalidar: se actualiza la caché sin recargar las pantallas. Un bloque que falte se resuelve
// en el servidor al publicar (resolverBloque).
export function listarBloques(): Promise<BloqueHorario[]> {
  return cacheCatalogo.leer(
    'bloques',
    async () => {
      const { data, error } = await supabase.from('bloques_horario').select('*').order('id');
      if (error) throw error;
      return data as BloqueHorario[];
    },
    { avisar: false }
  );
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


// ── Franjas con hora libre ───────────────────────────────────────────────────────

/** Franja que escribe el estudiante. Horas en 24 h, "HH:MM". */
export interface Franja {
  dias: string[];
  inicio: string;
  fin: string;
}

export const claveFranja = (f: Franja) => `${diasClave(f.dias)}|${f.inicio}|${f.fin}`;

function franjaDeBloque(b: BloqueHorario): Franja {
  return { dias: [...b.dias], inicio: b.hora_inicio.slice(0, 5), fin: b.hora_fin.slice(0, 5) };
}

export function etiquetaFranja(f: Franja): string {
  return `${diasCortos(f.dias)} ${rangoHoras({ hora_inicio: f.inicio, hora_fin: f.fin })}`;
}

/** Id del bloque para la franja: reutiliza uno existente o lo crea en el servidor. */
export async function resolverBloque(f: Franja, bloques: BloqueHorario[]): Promise<number> {
  const existente = bloques.find((b) => claveFranja(franjaDeBloque(b)) === claveFranja(f));
  if (existente) return existente.id;
  const { data, error } = await supabase.rpc('bloque_para_franja', { p_dias: f.dias, p_inicio: f.inicio, p_fin: f.fin });
  if (error) {
    if (error.code === 'PGRST202') throw new Error('El servidor aún no acepta horarios personalizados. Aplica la migración 20261023000003 en Supabase.');
    throw error;
  }
  return data as number;
}
