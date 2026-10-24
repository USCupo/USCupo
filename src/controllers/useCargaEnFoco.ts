import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { alCambiarCatalogo } from '../models/catalogo';
import { mensajeDeError } from './auth';
import { Cargador, type EstadoCarga } from './cargador';

interface Estado<T> extends EstadoCarga<T> {
  recargar: () => Promise<void>;
}

// Carga datos cada vez que la pantalla gana foco (al volver a una pestaña se ven los cambios
// hechos en otra), salvo que la última carga buena tenga menos de 15 s. La primera carga muestra
// "cargando"; las siguientes refrescan en silencio. Las acciones y "Reintentar" usan `recargar`,
// que siempre pide.
export function useCargaEnFoco<T>(cargar: () => Promise<T>, deps: unknown[]): Estado<T> {
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;
  const [estado, setEstado] = useState<EstadoCarga<T>>({ datos: null, cargando: true, error: null });
  const cargador = useRef<Cargador<T> | null>(null);
  if (!cargador.current) {
    cargador.current = new Cargador<T>({ cargar: () => cargarRef.current(), alCambiar: setEstado, mensajeDeError });
  }
  const c = cargador.current;

  // Otro usuario u otra carrera: lo cargado ya no vale y se pide de nuevo.
  const primera = useRef(true);
  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    c.invalidar();
    c.recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(
    useCallback(() => {
      c.alFoco();
    }, [c])
  );

  // El catálogo se revalidó con cambios (p. ej. una materia nueva): recarga silenciosa.
  useEffect(() => alCambiarCatalogo(() => void c.recargar()), [c]);

  const recargar = useCallback(() => c.recargar(), [c]);
  return { ...estado, recargar };
}
