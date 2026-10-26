import { useSyncExternalStore } from 'react';
import { consentimientoAnuncios as c, ESTADO_SIN_DECISION } from '../models/consentimientoAnuncios';

/** Preferencia de anuncios compartida por el aviso de cookies, Perfil y los espacios de anuncio. */
export function useConsentimientoAnuncios() {
  const estado = useSyncExternalStore(c.alCambiar, c.estado, () => ESTADO_SIN_DECISION);
  return { ...estado, elegir: c.elegir, abrirOpciones: c.abrirOpciones, cerrar: c.cerrar };
}
