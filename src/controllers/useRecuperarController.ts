import { useCallback, useEffect, useState } from 'react';
import { enviarRecuperacion, errorCorreo, mensajeDeError } from './auth';

// Supabase no deja pedir otro enlace al mismo correo antes de un minuto.
export const ESPERA_REENVIO_S = 60;

// El login pasa el correo que ya estaba escrito sin ponerlo en la URL (historial, registros).
let correoDelLogin = '';
export function llevarCorreoARecuperar(correo: string) {
  correoDelLogin = correo.trim();
}

// Controlador de "¿Olvidaste tu contraseña?": pide el correo y envía el enlace.
export function useRecuperarController() {
  const [correo, setCorreo] = useState(() => correoDelLogin);
  const [errorCampo, setErrorCampo] = useState<string | undefined>();
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  // Correo al que se envió el enlace (null = aún no).
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const cambiarCorreo = useCallback((v: string) => {
    setCorreo(v);
    setErrorCampo(undefined);
  }, []);

  const validarCorreo = useCallback(() => {
    setErrorCampo(correo ? errorCorreo(correo) : undefined);
  }, [correo]);

  const enviar = useCallback(async () => {
    setErrorFormulario(undefined);
    const error = errorCorreo(correo);
    setErrorCampo(error);
    if (error || espera > 0) return;

    setEnviando(true);
    try {
      await enviarRecuperacion(correo);
      setEnviadoA(correo.trim().toLowerCase());
      setEspera(ESPERA_REENVIO_S);
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }, [correo, espera]);

  // Volver al formulario para corregir el correo.
  const otroCorreo = useCallback(() => {
    setEnviadoA(null);
    setErrorFormulario(undefined);
  }, []);

  return { correo, cambiarCorreo, validarCorreo, errorCampo, errorFormulario, enviando, enviadoA, espera, enviar, otroCorreo };
}

export type RecuperarController = ReturnType<typeof useRecuperarController>;
