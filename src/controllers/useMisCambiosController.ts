import { useCallback, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { listarNotificaciones, marcarLeidas } from '../models/notificaciones';
import {
  confirmarCambio,
  eliminarOferta,
  liberarOferta,
  listarMisOfertas,
  listarOfertasConMiInteres,
  obtenerContacto,
  type OfertaDetalle,
} from '../models/ofertas';
import type { ContactoRevelado } from '../models/types';
import { mensajeDeError } from './auth';
import { useCargaEnFoco } from './useCargaEnFoco';

export type AccionPendiente = { tipo: 'confirmar' | 'liberar' | 'retirar'; oferta: OfertaDetalle };

export function useMisCambiosController() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const [accion, setAccion] = useState<AccionPendiente | null>(null);
  const [ejecutando, setEjecutando] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carga = useCargaEnFoco(async () => {
    const [mias, conMiInteres, avisos] = await Promise.all([
      listarMisOfertas(userId),
      listarOfertasConMiInteres(userId),
      listarNotificaciones(userId, 50),
    ]);

    const enConversacion = [
      ...mias.filter((o) => o.estado === 'en_proceso'),
      ...conMiInteres.filter((o) => o.estado === 'en_proceso'),
    ];
    // Con interesado activo, ambos ven el contacto del otro.
    const contactos = new Map<number, ContactoRevelado | null>();
    await Promise.all(
      enConversacion.map(async (o) => {
        try {
          contactos.set(o.id, await obtenerContacto(o.id));
        } catch {
          contactos.set(o.id, null);
        }
      })
    );

    // Al abrir Mis cambios se dan por vistos los avisos.
    marcarLeidas(avisos.filter((a) => !a.leida).map((a) => a.id)).catch(() => {});

    return {
      quierenMiCupo: mias.filter((o) => o.estado === 'en_proceso'),
      meInteresan: conMiInteres.filter((o) => o.estado === 'en_proceso'),
      publicadas: mias.filter((o) => o.estado === 'disponible'),
      contactos,
    };
  }, [userId]);

  const ejecutar = useCallback(async () => {
    if (!accion) return;
    setEjecutando(true);
    setErrorAccion(null);
    const materia = accion.oferta.materia.nombre;
    try {
      if (accion.tipo === 'confirmar') {
        await confirmarCambio(accion.oferta.id);
        setAviso(`Cambio de ${materia} confirmado. Quedó en tu historial.`);
      } else if (accion.tipo === 'liberar') {
        await liberarOferta(accion.oferta.id);
        setAviso(`Tu oferta de ${materia} vuelve a estar disponible.`);
      } else {
        await eliminarOferta(accion.oferta.id);
        setAviso(`Retiraste tu oferta de ${materia}.`);
      }
      setAccion(null);
      await carga.recargar();
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      setEjecutando(false);
    }
  }, [accion, carga]);

  return {
    ...carga,
    accion,
    pedirAccion: (a: AccionPendiente) => {
      setErrorAccion(null);
      setAccion(a);
    },
    cancelarAccion: () => setAccion(null),
    ejecutar,
    ejecutando,
    errorAccion,
    aviso,
    cerrarAviso: useCallback(() => setAviso(null), []),
  };
}
