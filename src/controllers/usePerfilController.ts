import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { obtenerCarrera } from '../models/carreras';
import { desbloquearUsuario, listarBloqueados, type UsuarioBloqueado } from '../models/moderacion';
import { listarMisOfertas } from '../models/ofertas';
import { actualizarPerfilPropio, eliminarMiCuenta } from '../models/perfiles';
import { cerrarSesion, errorNombre, mensajeDeError } from './auth';
import { useCargaEnFoco } from './useCargaEnFoco';

export const PALABRA_ELIMINAR = 'ELIMINAR';

// WhatsApp opcional: 10 dígitos colombianos (con o sin +57, espacios o guiones).
export function normalizarWhatsapp(v: string): string | null {
  const digitos = v.replace(/\D/g, '');
  if (!digitos) return null;
  const local = digitos.startsWith('57') && digitos.length === 12 ? digitos.slice(2) : digitos;
  return local.length === 10 && local.startsWith('3') ? `+57 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}` : '';
}

export function usePerfilController() {
  const { session, perfil, recargarPerfil } = useAuth();
  const userId = session?.user.id ?? '';

  const [nombre, setNombre] = useState(perfil?.nombre_completo ?? '');
  const [whatsapp, setWhatsapp] = useState(perfil?.whatsapp ?? '');
  const [mostrarCorreo, setMostrarCorreo] = useState(perfil?.mostrar_correo ?? true);
  const [mostrarWhatsapp, setMostrarWhatsapp] = useState(perfil?.mostrar_whatsapp ?? true);
  const [errores, setErrores] = useState<{ nombre?: string; whatsapp?: string }>({});
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  // Borrar cuenta: hay que escribir la palabra; un toque accidental no basta.
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [textoEliminar, setTextoEliminar] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const puedeEliminar = textoEliminar.trim().toUpperCase() === PALABRA_ELIMINAR;

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre_completo);
    setWhatsapp(perfil.whatsapp ?? '');
    setMostrarCorreo(perfil.mostrar_correo);
    setMostrarWhatsapp(perfil.mostrar_whatsapp);
  }, [perfil]);

  const carga = useCargaEnFoco(async () => {
    const [carrera, mias, bloqueados] = await Promise.all([
      perfil?.carrera_id ? obtenerCarrera(perfil.carrera_id) : Promise.resolve(null),
      listarMisOfertas(userId),
      // La tarjeta solo aparece si hay bloqueados: un fallo aquí no debe tumbar el perfil.
      listarBloqueados().catch((): UsuarioBloqueado[] => []),
    ]);
    return {
      carrera,
      bloqueados,
      historial: mias.filter((o) => o.estado === 'resuelta' || o.estado === 'expirada'),
      resueltas: mias.filter((o) => o.estado === 'resuelta').length,
    };
  }, [userId, perfil?.carrera_id]);

  const hayCambios =
    !!perfil &&
    (nombre.trim() !== perfil.nombre_completo ||
      (whatsapp.trim() || null) !== (perfil.whatsapp ?? null) ||
      mostrarCorreo !== perfil.mostrar_correo ||
      mostrarWhatsapp !== perfil.mostrar_whatsapp);

  const guardar = useCallback(async () => {
    setErrorGuardar(null);
    const wa = normalizarWhatsapp(whatsapp);
    const nuevos = {
      nombre: errorNombre(nombre),
      whatsapp: wa === '' ? 'Escribe un celular colombiano de 10 dígitos, por ejemplo 300 123 4567' : undefined,
    };
    setErrores(nuevos);
    if (nuevos.nombre || nuevos.whatsapp) return;
    if (!mostrarCorreo && !(wa && mostrarWhatsapp)) {
      setErrorGuardar('Deja visible al menos un medio de contacto; si no, nadie podrá escribirte para el cambio.');
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfilPropio(userId, {
        nombre_completo: nombre.trim(),
        whatsapp: wa,
        mostrar_correo: mostrarCorreo,
        mostrar_whatsapp: mostrarWhatsapp,
      });
      await recargarPerfil();
      setAviso('Perfil guardado');
    } catch (e) {
      setErrorGuardar(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  }, [nombre, whatsapp, mostrarCorreo, mostrarWhatsapp, userId, recargarPerfil]);

  const [desbloqueando, setDesbloqueando] = useState<string | null>(null);
  const desbloquear = useCallback(
    async (u: UsuarioBloqueado) => {
      if (desbloqueando) return;
      setDesbloqueando(u.usuario_id);
      try {
        await desbloquearUsuario(u.usuario_id);
        setAviso(`Desbloqueaste a ${u.nombre_completo}`);
        await carga.recargar();
      } catch (e) {
        setAviso(mensajeDeError(e));
      } finally {
        setDesbloqueando(null);
      }
    },
    [desbloqueando, carga]
  );

  const eliminarCuenta = useCallback(async () => {
    if (eliminando || !puedeEliminar) return;
    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarMiCuenta();
      // La sesión ya no vale: se cierra en este equipo y el índice vuelve al login.
      await cerrarSesion();
    } catch (e) {
      setErrorEliminar(mensajeDeError(e));
      setEliminando(false);
    }
  }, [eliminando, puedeEliminar]);

  return {
    ...carga,
    correo: perfil?.correo ?? session?.user.email ?? '',
    campos: { nombre, whatsapp, mostrarCorreo, mostrarWhatsapp },
    setNombre: (v: string) => {
      setNombre(v);
      setErrores((e) => ({ ...e, nombre: undefined }));
    },
    setWhatsapp: (v: string) => {
      setWhatsapp(v);
      setErrores((e) => ({ ...e, whatsapp: undefined }));
    },
    setMostrarCorreo,
    setMostrarWhatsapp,
    errores,
    errorGuardar,
    hayCambios,
    guardando,
    guardar,
    aviso,
    cerrarAviso: useCallback(() => setAviso(null), []),
    confirmarSalida,
    pedirSalida: () => setConfirmarSalida(true),
    cancelarSalida: () => setConfirmarSalida(false),
    salir: cerrarSesion,
    confirmarEliminar,
    textoEliminar,
    setTextoEliminar: (v: string) => {
      setTextoEliminar(v);
      setErrorEliminar(null);
    },
    puedeEliminar,
    eliminando,
    errorEliminar,
    pedirEliminar: () => {
      setTextoEliminar('');
      setErrorEliminar(null);
      setConfirmarEliminar(true);
    },
    cancelarEliminar: () => {
      if (!eliminando) setConfirmarEliminar(false);
    },
    eliminarCuenta,
    desbloquear,
    desbloqueando,
  };
}
