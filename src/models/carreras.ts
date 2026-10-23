import { supabase } from '../lib/supabase';
import { CARRERAS_LOCALES } from './data/carrerasLocales';
import type { Carrera } from './types';

export type OrigenCatalogo = 'remoto' | 'local';

export interface CatalogoCarreras {
  carreras: Carrera[];
  origen: OrigenCatalogo;
}

function ordenar(carreras: Carrera[]): Carrera[] {
  return [...carreras].sort(
    (a, b) =>
      a.facultad.localeCompare(b.facultad, 'es') ||
      a.nombre.localeCompare(b.nombre, 'es') ||
      a.sede.localeCompare(b.sede, 'es')
  );
}

// Lee el catálogo de Supabase; si el servidor no responde o la tabla está vacía, usa la
// copia local del seed para que el selector de carrera nunca quede vacío.
export async function listarCarreras(): Promise<CatalogoCarreras> {
  try {
    const { data, error } = await supabase
      .from('carreras')
      .select('*')
      .eq('activa', true)
      .order('facultad')
      .order('nombre');

    if (error) throw error;
    if (data && data.length > 0) return { carreras: ordenar(data as Carrera[]), origen: 'remoto' };
  } catch {
    // Cae al catálogo local.
  }
  return { carreras: ordenar(CARRERAS_LOCALES), origen: 'local' };
}

export interface GrupoFacultad {
  title: string;
  data: Carrera[];
}

export function agruparPorFacultad(carreras: Carrera[]): GrupoFacultad[] {
  const grupos = new Map<string, Carrera[]>();
  for (const c of carreras) {
    const lista = grupos.get(c.facultad) ?? [];
    lista.push(c);
    grupos.set(c.facultad, lista);
  }
  return Array.from(grupos, ([title, data]) => ({ title, data }));
}

const sinAcentos = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function filtrarCarreras(carreras: Carrera[], busqueda: string): Carrera[] {
  const q = sinAcentos(busqueda.trim());
  if (!q) return carreras;
  return carreras.filter((c) => sinAcentos(`${c.nombre} ${c.facultad} ${c.sede}`).includes(q));
}

export async function obtenerCarrera(id: number): Promise<Carrera | null> {
  const { data, error } = await supabase.from('carreras').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Carrera | null) ?? null;
}
