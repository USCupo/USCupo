import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { diasClave, listarMateriasDeCarrera } from '../models/catalogo';
import {
  esMatchReciproco,
  expresarInteres,
  listarMisOfertas,
  listarOfertasActivas,
  meSirve,
  type OfertaDetalle,
} from '../models/ofertas';
import type { Materia } from '../models/types';
import { mensajeDeError } from './auth';
import { useCargaEnFoco } from './useCargaEnFoco';

interface ResultadoBusqueda {
  oferta: OfertaDetalle;
  esMatch: boolean;
  meSirve: boolean;
  mia: OfertaDetalle | null;
}

export function useBuscarController(materiaInicial?: number) {
  const { session, perfil } = useAuth();
  const userId = session?.user.id ?? '';
  const carreraId = perfil?.carrera_id ?? null;

  const [materiaId, setMateriaId] = useState<number | null>(materiaInicial ?? null);
  const [dia, setDia] = useState<string | null>(null);
  const [soloCoincidencias, setSoloCoincidencias] = useState(false);
  const [interesEn, setInteresEn] = useState<OfertaDetalle | null>(null);
  const [enviandoInteres, setEnviandoInteres] = useState(false);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const carga = useCargaEnFoco(async () => {
    const materias = carreraId ? await listarMateriasDeCarrera(carreraId) : [];
    const [ofertas, mias] = await Promise.all([
      listarOfertasActivas(materias.map((m) => m.id)),
      listarMisOfertas(userId),
    ]);
    return { materias, ofertas, mias };
  }, [userId, carreraId]);

  const materias: Materia[] = carga.datos?.materias ?? [];

  // Ofertas ajenas por materia (para el contador de cada materia en la lista).
  const conteo = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const o of carga.datos?.ofertas ?? []) {
      if (o.user_id !== userId && o.estado === 'disponible') mapa.set(o.materia_id, (mapa.get(o.materia_id) ?? 0) + 1);
    }
    return mapa;
  }, [carga.datos, userId]);

  const resultados: ResultadoBusqueda[] = useMemo(() => {
    const mias = (carga.datos?.mias ?? []).filter((o) => o.estado === 'disponible');
    return (carga.datos?.ofertas ?? [])
      .filter((o) => o.user_id !== userId)
      .filter((o) => materiaId === null || o.materia_id === materiaId)
      .filter((o) => !dia || diasClave(o.bloque_actual.dias) === dia)
      .map((oferta) => {
        const miaMatch = mias.find((m) => esMatchReciproco(m, oferta)) ?? null;
        const miaSirve = mias.find((m) => meSirve(m, oferta)) ?? null;
        return { oferta, esMatch: !!miaMatch, meSirve: !!miaSirve, mia: miaMatch ?? miaSirve ?? mias.find((m) => m.materia_id === oferta.materia_id) ?? null };
      })
      .filter((r) => !soloCoincidencias || r.esMatch || r.meSirve)
      .sort(
        (a, b) =>
          Number(b.oferta.estado === 'disponible') - Number(a.oferta.estado === 'disponible') ||
          Number(b.esMatch) - Number(a.esMatch) ||
          Number(b.meSirve) - Number(a.meSirve)
      );
  }, [carga.datos, userId, materiaId, dia, soloCoincidencias]);

  const confirmarInteres = useCallback(async () => {
    if (!interesEn) return;
    setEnviandoInteres(true);
    setErrorAccion(null);
    try {
      await expresarInteres(interesEn.id);
      setAviso(`Listo. ${interesEn.dueno?.nombre_completo ?? 'El estudiante'} verá tu interés; su contacto está en Mis cambios.`);
      setInteresEn(null);
      await carga.recargar();
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      setEnviandoInteres(false);
    }
  }, [interesEn, carga]);

  return {
    ...carga,
    materias,
    conteo,
    materiaId,
    setMateriaId,
    materiaSeleccionada: materias.find((m) => m.id === materiaId) ?? null,
    dia,
    setDia,
    soloCoincidencias,
    setSoloCoincidencias,
    resultados,
    interesEn,
    pedirInteres: (o: OfertaDetalle) => {
      setErrorAccion(null);
      setInteresEn(o);
    },
    cancelarInteres: () => setInteresEn(null),
    confirmarInteres,
    enviandoInteres,
    errorAccion,
    aviso,
    cerrarAviso: useCallback(() => setAviso(null), []),
    tieneOfertasPropias: (carga.datos?.mias ?? []).some((o) => o.estado === 'disponible'),
  };
}
