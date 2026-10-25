import { supabase } from '../lib/supabase';
import type { BloqueHorario, ContactoRevelado, Materia, Oferta, PerfilPublico } from './types';

// Oferta con todo lo que una vista necesita para pintarla.
export interface OfertaDetalle extends Oferta {
  materia: Pick<Materia, 'id' | 'nombre' | 'codigo' | 'semestre' | 'carrera_id'>;
  bloque_actual: BloqueHorario;
  busco: BloqueHorario[];
  dueno: PerfilPublico | null;
  interesado: PerfilPublico | null;
}

const SELECT_DETALLE = `
  *,
  materia:materias(id, nombre, codigo, semestre, carrera_id),
  bloque_actual:bloques_horario!ofertas_bloque_actual_id_fkey(*),
  ofertas_busco(bloque:bloques_horario(*))
`;

type FilaOferta = Oferta & {
  materia: OfertaDetalle['materia'];
  bloque_actual: BloqueHorario;
  ofertas_busco: { bloque: BloqueHorario }[];
};

async function conDuenos(filas: FilaOferta[]): Promise<OfertaDetalle[]> {
  const ids = [...new Set(filas.flatMap((f) => [f.user_id, f.interesado_id]).filter(Boolean))] as string[];
  const perfiles = await perfilesPublicos(ids);
  return filas.map(({ ofertas_busco, ...f }) => ({
    ...f,
    busco: ofertas_busco.map((b) => b.bloque).sort((a, b) => a.id - b.id),
    dueno: perfiles.get(f.user_id) ?? null,
    interesado: f.interesado_id ? (perfiles.get(f.interesado_id) ?? null) : null,
  }));
}

async function perfilesPublicos(ids: string[]): Promise<Map<string, PerfilPublico>> {
  const mapa = new Map<string, PerfilPublico>();
  if (!ids.length) return mapa;
  const { data, error } = await supabase.from('perfiles_publicos').select('*').in('id', ids);
  if (error) throw error;
  for (const p of (data ?? []) as PerfilPublico[]) mapa.set(p.id, p);
  return mapa;
}

/** Ofertas visibles en la bolsa (disponibles y en proceso) de las materias indicadas. */
export async function listarOfertasActivas(materiaIds: number[]): Promise<OfertaDetalle[]> {
  if (!materiaIds.length) return [];
  const { data, error } = await supabase
    .from('ofertas')
    .select(SELECT_DETALLE)
    .in('materia_id', materiaIds)
    .in('estado', ['disponible', 'en_proceso'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return conDuenos(data as unknown as FilaOferta[]);
}

/** Todas las ofertas propias (cualquier estado). */
export async function listarMisOfertas(userId: string): Promise<OfertaDetalle[]> {
  const { data, error } = await supabase
    .from('ofertas')
    .select(SELECT_DETALLE)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return conDuenos(data as unknown as FilaOferta[]);
}

/** Ofertas de otros en las que marqué interés. */
export async function listarOfertasConMiInteres(userId: string): Promise<OfertaDetalle[]> {
  const { data, error } = await supabase
    .from('ofertas')
    .select(SELECT_DETALLE)
    .eq('interesado_id', userId)
    .order('interesado_at', { ascending: false });
  if (error) throw error;
  return conDuenos(data as unknown as FilaOferta[]);
}

export interface NuevaOferta {
  userId: string;
  materiaId: number;
  grupo: string;
  bloqueActualId: number;
  bloquesBuscoIds: number[];
  comentario?: string;
}

export async function crearOferta(n: NuevaOferta): Promise<number> {
  const { data, error } = await supabase
    .from('ofertas')
    .insert({
      user_id: n.userId,
      materia_id: n.materiaId,
      grupo: n.grupo.trim(),
      bloque_actual_id: n.bloqueActualId,
      comentario: n.comentario?.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: errorBusco } = await supabase
    .from('ofertas_busco')
    .insert(n.bloquesBuscoIds.map((bloque_id) => ({ oferta_id: data.id, bloque_id })));
  if (errorBusco) {
    // Sin franjas buscadas la oferta no sirve: se deshace.
    await supabase.from('ofertas').delete().eq('id', data.id);
    throw errorBusco;
  }
  return data.id as number;
}

export async function eliminarOferta(ofertaId: number): Promise<void> {
  const { error } = await supabase.from('ofertas').delete().eq('id', ofertaId);
  if (error) throw error;
}

/** El dueño libera una oferta en proceso: vuelve a estar disponible para otros. */
export async function liberarOferta(ofertaId: number): Promise<void> {
  const { error: errorRpc } = await supabase.rpc('liberar_oferta', { p_oferta_id: ofertaId });
  // Sin la migración 20261024000004 aplicada todavía, se libera como antes.
  if (errorRpc?.code !== 'PGRST202') {
    if (errorRpc) throw errorRpc;
    return;
  }
  const { error } = await supabase
    .from('ofertas')
    .update({ estado: 'disponible', interesado_id: null, interesado_at: null, expires_at: null })
    .eq('id', ofertaId)
    .eq('estado', 'en_proceso');
  if (error) throw error;
}

export async function expresarInteres(ofertaId: number): Promise<void> {
  const { error } = await supabase.rpc('expresar_interes', { p_oferta_id: ofertaId });
  if (error) throw error;
}

export async function confirmarCambio(ofertaId: number): Promise<void> {
  const { error } = await supabase.rpc('confirmar_cambio', { p_oferta_id: ofertaId });
  if (error) throw error;
}

export async function obtenerContacto(ofertaId: number): Promise<ContactoRevelado | null> {
  const { data, error } = await supabase.rpc('contacto_revelado', { p_oferta_id: ofertaId });
  if (error) throw error;
  return ((data as ContactoRevelado[] | null) ?? [])[0] ?? null;
}

// ── Reglas de dominio (puras, sin red) ──────────────────────────────────────────

/** Match recíproco: el otro ofrece algo que busco y busca lo que yo tengo. */
export function esMatchReciproco(mia: OfertaDetalle, otra: OfertaDetalle): boolean {
  return (
    mia.materia_id === otra.materia_id &&
    mia.user_id !== otra.user_id &&
    mia.busco.some((b) => b.id === otra.bloque_actual_id) &&
    otra.busco.some((b) => b.id === mia.bloque_actual_id)
  );
}

/** Ofrece algo que busco, aunque no busque lo mío. */
export function meSirve(mia: OfertaDetalle, otra: OfertaDetalle): boolean {
  return mia.materia_id === otra.materia_id && mia.busco.some((b) => b.id === otra.bloque_actual_id);
}

export function diasRestantes(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

export function hace(fechaIso: string): string {
  const min = Math.round((Date.now() - new Date(fechaIso).getTime()) / 60_000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'ayer';
  if (d < 30) return `hace ${d} días`;
  return new Date(fechaIso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}
