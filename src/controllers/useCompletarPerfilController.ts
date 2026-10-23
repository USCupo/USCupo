import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { listarCarreras, type OrigenCatalogo } from '../models/carreras';
import { actualizarPerfilPropio } from '../models/perfiles';
import type { Carrera } from '../models/types';
import { cerrarSesion, errorNombre, mensajeDeError } from './auth';

// Si el nombre llegó como la parte local del correo (juan.perez), lo propone legible.
function nombreSugerido(nombre: string | undefined, correo: string | undefined): string {
  if (!nombre) return '';
  const local = correo?.split('@')[0];
  if (nombre !== local) return nombre;
  return nombre
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export function useCompletarPerfilController() {
  const { session, perfil, recargarPerfil } = useAuth();
  const [nombreCompleto, setNombreCompleto] = useState(() =>
    nombreSugerido(perfil?.nombre_completo, perfil?.correo ?? session?.user.email)
  );
  const [carrera, setCarrera] = useState<Carrera | null>(null);
  const [carreras, setCarreras] = useState<{ lista: Carrera[]; cargando: boolean; origen: OrigenCatalogo | null }>({
    lista: [],
    cargando: true,
    origen: null,
  });
  const [errores, setErrores] = useState<{ nombre?: string; carrera?: string }>({});
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    listarCarreras().then(({ carreras: lista, origen }) => setCarreras({ lista, cargando: false, origen }));
  }, []);

  const elegirCarrera = useCallback((c: Carrera) => {
    setCarrera(c);
    setErrores((e) => ({ ...e, carrera: undefined }));
  }, []);

  const guardar = useCallback(async () => {
    setErrorFormulario(undefined);
    const nuevos = {
      nombre: errorNombre(nombreCompleto),
      carrera: carrera ? undefined : 'Elige tu carrera para continuar',
    };
    setErrores(nuevos);
    if (nuevos.nombre || nuevos.carrera || !session) return;

    setGuardando(true);
    try {
      await actualizarPerfilPropio(session.user.id, {
        nombre_completo: nombreCompleto.trim(),
        carrera_id: carrera!.id,
      });
      await recargarPerfil();
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }, [nombreCompleto, carrera, session, recargarPerfil]);

  return {
    correo: perfil?.correo ?? session?.user.email ?? '',
    nombreCompleto,
    setNombreCompleto: (v: string) => {
      setNombreCompleto(v);
      if (errores.nombre) setErrores((e) => ({ ...e, nombre: undefined }));
    },
    carrera,
    elegirCarrera,
    carreras,
    errores,
    errorFormulario,
    guardando,
    guardar,
    salir: cerrarSesion,
  };
}
