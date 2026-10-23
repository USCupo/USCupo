import { useAuth } from '../lib/AuthContext';
import { obtenerCarrera } from '../models/carreras';
import { listarMateriasDeCarrera } from '../models/catalogo';
import { listarNotificaciones, type Notificacion } from '../models/notificaciones';
import { esMatchReciproco, listarMisOfertas, listarOfertasActivas, type OfertaDetalle } from '../models/ofertas';
import { useCargaEnFoco } from './useCargaEnFoco';

export interface ResumenInicio {
  carrera: string | null;
  hayMaterias: boolean;
  /** Mis ofertas en proceso: alguien quiere mi cupo y falta confirmar. */
  porConfirmar: OfertaDetalle[];
  /** Ofertas de otros que hacen match recíproco con alguna mía disponible. */
  coincidencias: { oferta: OfertaDetalle; mia: OfertaDetalle }[];
  recientes: OfertaDetalle[];
  avisos: Notificacion[];
  misActivas: number;
}

export function useInicioController() {
  const { session, perfil } = useAuth();
  const userId = session?.user.id ?? '';
  const carreraId = perfil?.carrera_id ?? null;

  const carga = useCargaEnFoco<ResumenInicio>(async () => {
    const [carrera, materias, mias, avisos] = await Promise.all([
      carreraId ? obtenerCarrera(carreraId) : Promise.resolve(null),
      carreraId ? listarMateriasDeCarrera(carreraId) : Promise.resolve([]),
      listarMisOfertas(userId),
      listarNotificaciones(userId, 6),
    ]);
    const activas = await listarOfertasActivas(materias.map((m) => m.id));
    const ajenas = activas.filter((o) => o.user_id !== userId && o.estado === 'disponible');
    const misDisponibles = mias.filter((o) => o.estado === 'disponible');

    const coincidencias = ajenas.flatMap((oferta) => {
      const mia = misDisponibles.find((m) => esMatchReciproco(m, oferta));
      return mia ? [{ oferta, mia }] : [];
    });
    const idsMatch = new Set(coincidencias.map((c) => c.oferta.id));

    return {
      carrera: carrera ? `${carrera.nombre} · ${carrera.sede}` : null,
      hayMaterias: materias.length > 0,
      porConfirmar: mias.filter((o) => o.estado === 'en_proceso'),
      coincidencias,
      recientes: ajenas.filter((o) => !idsMatch.has(o.id)).slice(0, 6),
      avisos,
      misActivas: mias.filter((o) => o.estado === 'disponible' || o.estado === 'en_proceso').length,
    };
  }, [userId, carreraId]);

  const primerNombre = (perfil?.nombre_completo ?? '').split(' ')[0] || 'estudiante';
  return { ...carga, primerNombre };
}
