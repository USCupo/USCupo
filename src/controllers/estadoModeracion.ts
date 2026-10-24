// Estado de reportar/bloquear (ModeracionController.kt de Android), sin React para probarlo solo.

export type ClaveMotivo = 'ofensivo' | 'datos_personales' | 'spam' | 'falso' | 'otro';

/** Motivos de reporte; `clave` es el valor que valida la RPC reportar_oferta. */
export const MOTIVOS_REPORTE: readonly { clave: ClaveMotivo; etiqueta: string }[] = [
  { clave: 'ofensivo', etiqueta: 'Contenido ofensivo o acoso' },
  { clave: 'datos_personales', etiqueta: 'Comparte datos personales' },
  { clave: 'spam', etiqueta: 'Spam o publicidad' },
  { clave: 'falso', etiqueta: 'Oferta falsa o engañosa' },
  { clave: 'otro', etiqueta: 'Otro motivo' },
];

export const MAX_DETALLE = 500;

/** Lo mínimo de una oferta que hace falta para reportarla. */
export interface OfertaReportable {
  id: number;
  materia: { nombre: string };
}

export interface Bloqueable {
  usuarioId: string;
  nombre: string;
}

export interface EstadoModeracion<O extends OfertaReportable = OfertaReportable> {
  /** Oferta que se está reportando (diálogo abierto). */
  reportando: O | null;
  motivo: ClaveMotivo | null;
  detalle: string;
  /** Estudiante que se está bloqueando (diálogo abierto). */
  bloqueando: Bloqueable | null;
  enviando: boolean;
  error: string | null;
  aviso: string | null;
}

export const ESTADO_INICIAL: EstadoModeracion<never> = {
  reportando: null,
  motivo: null,
  detalle: '',
  bloqueando: null,
  enviando: false,
  error: null,
  aviso: null,
};

type E = EstadoModeracion<any>;

export const transiciones = {
  pedirReporte: <S extends E>(s: S, o: S['reportando']): S =>
    s.enviando ? s : { ...s, reportando: o, motivo: null, detalle: '', bloqueando: null, error: null },
  pedirBloqueo: <S extends E>(s: S, usuarioId: string, nombre: string): S =>
    s.enviando ? s : { ...s, bloqueando: { usuarioId, nombre }, reportando: null, error: null },
  elegirMotivo: <S extends E>(s: S, motivo: ClaveMotivo): S => ({ ...s, motivo, error: null }),
  setDetalle: <S extends E>(s: S, texto: string): S => ({ ...s, detalle: texto.slice(0, MAX_DETALLE) }),
  cancelar: <S extends E>(s: S): S => (s.enviando ? s : { ...s, reportando: null, bloqueando: null, error: null }),
  cerrarAviso: <S extends E>(s: S): S => ({ ...s, aviso: null }),
  enviar: <S extends E>(s: S): S => ({ ...s, enviando: true, error: null }),
  fallo: <S extends E>(s: S, error: string): S => ({ ...s, enviando: false, error }),
  exito: <S extends E>(s: S): S => ({
    ...ESTADO_INICIAL,
    aviso: s.reportando
      ? 'Gracias por avisar. Revisaremos la oferta y ya no la verás.'
      : `Bloqueaste a ${s.bloqueando?.nombre}. Ya no verán sus ofertas entre ustedes.`,
  }) as S,
};

/** Error que impide confirmar, o null si se puede enviar. */
export function validarConfirmacion(s: E): string | null {
  if (s.reportando && !s.motivo) return 'Elige un motivo.';
  return null;
}
