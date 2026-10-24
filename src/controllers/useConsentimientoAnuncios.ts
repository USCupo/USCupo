import { useSyncExternalStore } from 'react';
import { consentimientoAnuncios as c } from '../models/consentimientoAnuncios';

/** Preferencia de anuncios compartida por el aviso de cookies, Perfil y los espacios de anuncio. */
export function useConsentimientoAnuncios() {
  const estado = useSyncExternalStore(c.alCambiar, c.estado, c.estado);
  return { ...estado, elegir: c.elegir, abrirOpciones: c.abrirOpciones, cerrar: c.cerrar };
}
