import { useCallback, useRef, useState } from 'react';
import { bloquearUsuario, reportarOferta } from '../models/moderacion';
import type { OfertaDetalle } from '../models/ofertas';
import { mensajeDeError } from './auth';
import { ESTADO_INICIAL, transiciones as t, validarConfirmacion, type ClaveMotivo, type EstadoModeracion } from './estadoModeracion';

/**
 * Reportar una oferta o bloquear a su autor desde cualquier lista (Buscar, Inicio, Mis cambios).
 * Al terminar llama a `alTerminar` para que la pantalla recargue: la RLS ya no devuelve lo
 * reportado ni lo bloqueado.
 */
export function useModeracionController(alTerminar: () => unknown) {
  const [s, setS] = useState<EstadoModeracion<OfertaDetalle>>(ESTADO_INICIAL);
  const actual = useRef(s);
  actual.current = s;
  const terminar = useRef(alTerminar);
  terminar.current = alTerminar;

  const confirmar = useCallback(async () => {
    const e = actual.current;
    if (e.enviando || (!e.reportando && !e.bloqueando)) return;
    const invalido = validarConfirmacion(e);
    if (invalido) return setS((x) => ({ ...x, error: invalido }));
    setS(t.enviar);
    try {
      if (e.reportando) await reportarOferta(e.reportando.id, e.motivo as ClaveMotivo, e.detalle);
      else await bloquearUsuario(e.bloqueando!.usuarioId);
      setS(() => t.exito(e));
      terminar.current();
    } catch (err) {
      setS((x) => t.fallo(x, mensajeDeError(err)));
    }
  }, []);

  return {
    estado: s,
    pedirReporte: useCallback((o: OfertaDetalle) => setS((x) => t.pedirReporte(x, o)), []),
    pedirBloqueo: useCallback((usuarioId: string, nombre: string) => setS((x) => t.pedirBloqueo(x, usuarioId, nombre)), []),
    elegirMotivo: useCallback((m: ClaveMotivo) => setS((x) => t.elegirMotivo(x, m)), []),
    setDetalle: useCallback((v: string) => setS((x) => t.setDetalle(x, v)), []),
    cancelar: useCallback(() => setS(t.cancelar), []),
    cerrarAviso: useCallback(() => setS(t.cerrarAviso), []),
    confirmar,
  };
}

export type ModeracionController = ReturnType<typeof useModeracionController>;
