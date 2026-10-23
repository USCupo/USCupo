import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { mensajeDeError } from './auth';

interface Estado<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

// Carga datos cada vez que la pantalla gana foco (al volver a una pestaña se ven los
// cambios hechos en otra). La primera carga muestra "cargando"; las siguientes refrescan
// en silencio para no hacer parpadear la vista.
export function useCargaEnFoco<T>(cargar: () => Promise<T>, deps: unknown[]): Estado<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const turno = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    const mio = ++turno.current;
    try {
      const r = await cargar();
      if (mio === turno.current) {
        setDatos(r);
        setError(null);
      }
    } catch (e) {
      if (mio === turno.current) setError(mensajeDeError(e));
    } finally {
      if (mio === turno.current) setCargando(false);
    }
  }, deps);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar])
  );

  return { datos, cargando, error, recargar };
}
