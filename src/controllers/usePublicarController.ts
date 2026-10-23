import { useCallback, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { claveFranja, listarBloques, listarMateriasDeCarrera, resolverBloque, type Franja } from '../models/catalogo';
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
  const [actual, setActual] = useState<Franja | null>(null);
  const [busco, setBusco] = useState<Franja[]>([]);
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

  const elegirActual = (f: Franja) => {
    setActual(f);
    setBusco((b) => b.filter((x) => claveFranja(x) !== claveFranja(f))); // no se busca lo que ya se tiene
    limpiar('actual');
  };

  const agregarBusco = (f: Franja) => {
    setBusco((b) => (b.some((x) => claveFranja(x) === claveFranja(f)) ? b : [...b, f]));
    limpiar('busco');
  };

  const quitarBusco = (f: Franja) => setBusco((b) => b.filter((x) => claveFranja(x) !== claveFranja(f)));

  const reiniciar = useCallback(() => {
    setMateriaId(null);
    setGrupo('');
    setActual(null);
    setBusco([]);
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
      actual: actual ? undefined : 'Elige el horario que tienes',
      busco: busco.length ? undefined : 'Agrega al menos un horario que te sirva',
    };
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    setPublicando(true);
    try {
      // Cada franja escrita se traduce al id de su bloque (existente o recién creado).
      const bloques = carga.datos?.bloques ?? [];
      const [bloqueActualId, ...bloquesBuscoIds] = await Promise.all([actual!, ...busco].map((f) => resolverBloque(f, bloques)));
      const id = await crearOferta({
        userId,
        materiaId: materiaId!,
        grupo,
        bloqueActualId,
        bloquesBuscoIds,
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
  }, [materiaId, grupo, actual, busco, comentario, userId, carga, materiasConOfertaActiva]);

  return {
    ...carga,
    materias: carga.datos?.materias ?? [],
    materiasConOfertaActiva,
    campos: { materiaId, grupo, actual, busco, comentario },
    elegirMateria,
    setGrupo: (v: string) => {
      setGrupo(v);
      limpiar('grupo');
    },
    elegirActual,
    quitarActual: () => setActual(null),
    agregarBusco,
    quitarBusco,
    setComentario,
    errores,
    errorFormulario,
    publicando,
    publicar,
    publicada,
    reiniciar,
  };
}
