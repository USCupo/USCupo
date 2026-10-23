import { useCallback, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { listarBloques, listarMateriasDeCarrera } from '../models/catalogo';
import { crearOferta, esMatchReciproco, listarMisOfertas, listarOfertasActivas } from '../models/ofertas';
import { mensajeDeError } from './auth';
import { useCargaEnFoco } from './useCargaEnFoco';

type Campo = 'materia' | 'grupo' | 'actual' | 'busco';

export interface Publicada {
  materiaId: number;
  materiaNombre: string;
  coincidencias: number;
}

export function usePublicarController() {
  const { session, perfil } = useAuth();
  const userId = session?.user.id ?? '';
  const carreraId = perfil?.carrera_id ?? null;

  const [materiaId, setMateriaId] = useState<number | null>(null);
  const [grupo, setGrupo] = useState('');
  const [actualId, setActualId] = useState<number | null>(null);
  const [buscoIds, setBuscoIds] = useState<number[]>([]);
  const [comentario, setComentario] = useState('');
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [publicada, setPublicada] = useState<Publicada | null>(null);

  const carga = useCargaEnFoco(async () => {
    const [materias, bloques, mias] = await Promise.all([
      carreraId ? listarMateriasDeCarrera(carreraId) : Promise.resolve([]),
      listarBloques(),
      listarMisOfertas(userId),
    ]);
    return { materias, bloques, mias };
  }, [userId, carreraId]);

  const materiasConOfertaActiva = new Set(
    (carga.datos?.mias ?? []).filter((o) => o.estado === 'disponible' || o.estado === 'en_proceso').map((o) => o.materia_id)
  );

  const limpiar = (campo: Campo) => setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));

  const elegirMateria = (id: number) => {
    setMateriaId(id);
    limpiar('materia');
  };

  const elegirActual = (id: number) => {
    setActualId(id);
    setBuscoIds((b) => b.filter((x) => x !== id)); // no se busca lo que ya se tiene
    limpiar('actual');
  };

  const alternarBusco = (id: number) => {
    setBuscoIds((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
    limpiar('busco');
  };

  const reiniciar = useCallback(() => {
    setMateriaId(null);
    setGrupo('');
    setActualId(null);
    setBuscoIds([]);
    setComentario('');
    setErrores({});
    setErrorFormulario(null);
    setPublicada(null);
  }, []);

  const publicar = useCallback(async () => {
    setErrorFormulario(null);
    const nuevos: Partial<Record<Campo, string>> = {
      materia: !materiaId
        ? 'Elige la materia'
        : materiasConOfertaActiva.has(materiaId)
          ? 'Ya tienes una oferta activa de esta materia. Retírala en Mis cambios para publicar otra.'
          : undefined,
      grupo: grupo.trim() ? undefined : 'Escribe tu número de grupo',
      actual: actualId ? undefined : 'Elige el horario que tienes',
      busco: buscoIds.length ? undefined : 'Elige al menos un horario que te sirva',
    };
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    setPublicando(true);
    try {
      const id = await crearOferta({
        userId,
        materiaId: materiaId!,
        grupo,
        bloqueActualId: actualId!,
        bloquesBuscoIds: buscoIds,
        comentario,
      });
      const activas = await listarOfertasActivas([materiaId!]);
      const mia = activas.find((o) => o.id === id);
      const coincidencias = mia ? activas.filter((o) => o.estado === 'disponible' && esMatchReciproco(mia, o)).length : 0;
      setPublicada({
        materiaId: materiaId!,
        materiaNombre: carga.datos?.materias.find((m) => m.id === materiaId)?.nombre ?? 'tu materia',
        coincidencias,
      });
      await carga.recargar();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setPublicando(false);
    }
  }, [materiaId, grupo, actualId, buscoIds, comentario, userId, carga, materiasConOfertaActiva]);

  return {
    ...carga,
    materias: carga.datos?.materias ?? [],
    bloques: carga.datos?.bloques ?? [],
    materiasConOfertaActiva,
    campos: { materiaId, grupo, actualId, buscoIds, comentario },
    elegirMateria,
    setGrupo: (v: string) => {
      setGrupo(v);
      limpiar('grupo');
    },
    elegirActual,
    alternarBusco,
    setComentario,
    errores,
    errorFormulario,
    publicando,
    publicar,
    publicada,
    reiniciar,
  };
}
