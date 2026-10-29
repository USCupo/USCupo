import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { cambiarContrasena, errorContrasena, mensajeDeError, verificarEnlaceRecuperacion } from './auth';

type FaseRestablecer = 'verificando' | 'formulario' | 'invalido' | 'hecho';

export interface ParamsEnlace {
  code?: string;
  token_hash?: string;
  type?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
}

// Si el canje del ?code= no termina en una sesión de recuperación en este tiempo, el enlace no sirvió.
const ESPERA_CANJE_MS = 4000;

type Campo = 'nueva' | 'confirmacion';

// Controlador de /restablecer: valida el enlace del correo y guarda la contraseña nueva. Solo deja
// cambiarla con una sesión de recuperación; una sesión normal que llegue aquí ve "enlace no válido".
export function useRestablecerController(params: ParamsEnlace) {
  const { recuperando } = useAuth();
  // Supabase limpia la URL al canjear: se usa lo que traía al abrir la página.
  const enlace = useRef(params).current;

  const [fase, setFase] = useState<FaseRestablecer>('verificando');
  const [motivo, setMotivo] = useState<string | undefined>();
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<Partial<Record<Campo, string>>>({});
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [guardando, setGuardando] = useState(false);

  const invalidar = useCallback((e: unknown) => {
    setMotivo(mensajeDeError(e));
    setFase((f) => (f === 'verificando' ? 'invalido' : f));
  }, []);

  // PASSWORD_RECOVERY llega por AuthContext tanto con ?code= como con ?token_hash=.
  useEffect(() => {
    if (recuperando) setFase((f) => (f === 'verificando' ? 'formulario' : f));
  }, [recuperando]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const errorUrl = enlace.error_description ?? enlace.error_code ?? hash.get('error_description') ?? hash.get('error_code');
    if (errorUrl) return invalidar(new Error(errorUrl));

    if (enlace.token_hash && enlace.type === 'recovery') {
      verificarEnlaceRecuperacion(enlace.token_hash).catch(invalidar);
      return;
    }
    if (enlace.code) {
      let t: ReturnType<typeof setTimeout> | undefined;
      // getSession espera a que Supabase termine de canjear el código.
      supabase.auth.getSession().then(() => {
        t = setTimeout(() => invalidar(new Error('auth session missing')), ESPERA_CANJE_MS);
      });
      return () => clearTimeout(t);
    }
    // Sin enlace: solo sirve si Supabase ya abrió la recuperación (llegó desde otra ruta).
    if (!recuperando) invalidar(new Error('auth session missing'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiar = useCallback((campo: Campo) => {
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
    setErrorFormulario(undefined);
  }, []);

  const cambiarNueva = useCallback((v: string) => {
    setNueva(v);
    limpiar('nueva');
  }, [limpiar]);

  const cambiarConfirmacion = useCallback((v: string) => {
    setConfirmacion(v);
    limpiar('confirmacion');
  }, [limpiar]);

  const validarNueva = useCallback(() => {
    setErrores((e) => ({ ...e, nueva: nueva ? errorContrasena(nueva) : undefined }));
  }, [nueva]);

  const guardar = useCallback(async () => {
    const nuevos = {
      nueva: errorContrasena(nueva),
      confirmacion: confirmacion === nueva ? undefined : 'Las contraseñas no coinciden',
    };
    setErrores(nuevos);
    if (nuevos.nueva || nuevos.confirmacion) return;

    setGuardando(true);
    setErrorFormulario(undefined);
    try {
      await cambiarContrasena(nueva);
      setFase('hecho');
    } catch (e) {
      const msg = mensajeDeError(e);
      if (/venció|ya se usó/.test(msg)) {
        setMotivo(msg);
        setFase('invalido');
      } else {
        setErrorFormulario(msg);
      }
    } finally {
      setGuardando(false);
    }
  }, [nueva, confirmacion]);

  return {
    fase,
    motivo,
    campos: { nueva, confirmacion },
    cambiarNueva,
    cambiarConfirmacion,
    validarNueva,
    errores,
    errorFormulario,
    guardando,
    guardar,
  };
}

export type RestablecerController = ReturnType<typeof useRestablecerController>;
