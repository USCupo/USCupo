import { useCallback, useEffect, useState } from 'react';
import { listarCarreras, type OrigenCatalogo } from '../models/carreras';
import type { Carrera } from '../models/types';
import { ERROR_SIN_ACEPTAR, VERSION_LEGAL } from '../models/legal';
import {
  errorContrasena,
  errorCorreo,
  errorNombre,
  iniciarSesion,
  iniciarSesionConMicrosoft,
  mensajeDeError,
  registrarse,
  reenviarConfirmacion,
} from './auth';
import { ESPERA_REENVIO_S } from './useRecuperarController';

export type ModoLogin = 'registro' | 'ingreso';

type Campo = 'nombre' | 'correo' | 'carrera' | 'contrasena' | 'legal';
type Errores = Partial<Record<Campo, string>>;

export interface EstadoCarreras {
  lista: Carrera[];
  cargando: boolean;
  origen: OrigenCatalogo | null;
}

// Controlador de la pantalla de acceso: estado del formulario, validación y envío.
export function useLoginController(modoInicial: ModoLogin = 'registro') {
  const [modo, setModoState] = useState<ModoLogin>(modoInicial);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [carrera, setCarrera] = useState<Carrera | null>(null);
  // Casilla de términos y política (Ley 1581): solo al crear cuenta y nunca marcada de entrada.
  const [aceptaLegal, setAceptaLegalState] = useState(false);
  // "Mantener sesión iniciada": desmarcada, la sesión se cierra con la pestaña.
  const [recordar, setRecordar] = useState(false);

  const [carreras, setCarreras] = useState<EstadoCarreras>({ lista: [], cargando: true, origen: null });
  const [errores, setErrores] = useState<Errores>({});
  const [errorFormulario, setErrorFormulario] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [microsoftCargando, setMicrosoftCargando] = useState(false);
  // Correo al que se envió el enlace de confirmación (false = sin aviso).
  const [avisoConfirmacion, setAvisoConfirmacion] = useState<string | false>(false);
  // Cuenta sin confirmar (recién creada o al intentar entrar): se puede pedir otro enlace.
  const [porConfirmar, setPorConfirmar] = useState<string | null>(null);
  const [reenvio, setReenvio] = useState<{ enviando: boolean; espera: number; hecho: boolean }>({
    enviando: false,
    espera: 0,
    hecho: false,
  });

  useEffect(() => {
    if (reenvio.espera <= 0) return;
    const t = setTimeout(() => setReenvio((r) => ({ ...r, espera: r.espera - 1 })), 1000);
    return () => clearTimeout(t);
  }, [reenvio.espera]);

  const cargarCarreras = useCallback(async () => {
    setCarreras((c) => ({ ...c, cargando: true }));
    const { carreras: lista, origen } = await listarCarreras();
    setCarreras({ lista, cargando: false, origen });
  }, []);

  useEffect(() => {
    cargarCarreras();
  }, [cargarCarreras]);

  const setModo = useCallback((nuevo: ModoLogin) => {
    setModoState(nuevo);
    setErrores({});
    setErrorFormulario(undefined);
    setAvisoConfirmacion(false);
    setPorConfirmar(null);
  }, []);

  const alternarModo = useCallback(() => setModo(modo === 'registro' ? 'ingreso' : 'registro'), [modo, setModo]);

  // Validación al salir del campo, no en cada tecla.
  const validarCampo = useCallback(
    (campo: Campo) => {
      const error =
        campo === 'correo'
          ? errorCorreo(correo)
          : campo === 'nombre'
            ? errorNombre(nombreCompleto)
            : campo === 'contrasena'
              ? errorContrasena(contrasena)
              : undefined;
      // Un campo vacío al salir no es error todavía; se marca al enviar.
      const vacio = campo === 'correo' ? !correo : campo === 'nombre' ? !nombreCompleto : !contrasena;
      setErrores((e) => ({ ...e, [campo]: vacio ? undefined : error }));
    },
    [correo, nombreCompleto, contrasena]
  );

  const limpiarError = useCallback((campo: Campo) => {
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e));
  }, []);

  const elegirCarrera = useCallback((c: Carrera) => {
    setCarrera(c);
    setErrores((e) => ({ ...e, carrera: undefined }));
  }, []);

  const enviar = useCallback(async () => {
    setErrorFormulario(undefined);
    setAvisoConfirmacion(false);
    setPorConfirmar(null);

    const nuevos: Errores = {
      correo: errorCorreo(correo),
      contrasena: modo === 'registro' ? errorContrasena(contrasena) : contrasena ? undefined : 'Escribe tu contraseña',
    };
    if (modo === 'registro') {
      nuevos.nombre = errorNombre(nombreCompleto);
      nuevos.carrera = carrera ? undefined : 'Elige tu carrera para continuar';
      nuevos.legal = aceptaLegal ? undefined : ERROR_SIN_ACEPTAR;
    }
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) return;

    setEnviando(true);
    try {
      if (modo === 'registro') {
        const { session } = await registrarse({ nombreCompleto, correo, contrasena, carreraId: carrera!.id, legalVersion: VERSION_LEGAL });
        if (!session) {
          setAvisoConfirmacion(correo.trim().toLowerCase());
          setPorConfirmar(correo.trim().toLowerCase());
          setReenvio({ enviando: false, espera: ESPERA_REENVIO_S, hecho: false });
          setContrasena('');
        }
      } else {
        await iniciarSesion(correo, contrasena, recordar);
      }
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
      if (String((e as Error)?.message).toLowerCase().includes('email not confirmed')) {
        setPorConfirmar(correo.trim().toLowerCase());
      }
    } finally {
      setEnviando(false);
    }
  }, [modo, nombreCompleto, correo, contrasena, carrera, aceptaLegal, recordar]);

  const reenviar = useCallback(async () => {
    if (!porConfirmar || reenvio.espera > 0) return;
    setReenvio((r) => ({ ...r, enviando: true, hecho: false }));
    setErrorFormulario(undefined);
    try {
      await reenviarConfirmacion(porConfirmar);
      setReenvio({ enviando: false, espera: ESPERA_REENVIO_S, hecho: true });
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
      setReenvio((r) => ({ ...r, enviando: false }));
    }
  }, [porConfirmar, reenvio.espera]);

  const setAceptaLegal = useCallback((v: boolean) => {
    setAceptaLegalState(v);
    setErrores((e) => (e.legal ? { ...e, legal: undefined } : e));
  }, []);

  // Sirve igual para crear cuenta e iniciar sesión: Supabase crea el perfil la primera vez.
  const entrarConMicrosoft = useCallback(async () => {
    setErrorFormulario(undefined);
    setAvisoConfirmacion(false);
    setMicrosoftCargando(true);
    try {
      // La página navega a Microsoft: el indicador sigue hasta salir.
      await iniciarSesionConMicrosoft(recordar, correo);
    } catch (e) {
      setErrorFormulario(mensajeDeError(e));
      setMicrosoftCargando(false);
    }
  }, [correo, recordar]);

  return {
    modo,
    setModo,
    alternarModo,
    campos: { nombreCompleto, correo, contrasena, carrera, aceptaLegal, recordar },
    setAceptaLegal,
    setRecordar,
    setNombreCompleto,
    setCorreo,
    setContrasena,
    elegirCarrera,
    carreras,
    recargarCarreras: cargarCarreras,
    errores,
    validarCampo,
    limpiarError,
    errorFormulario,
    avisoConfirmacion,
    porConfirmar,
    reenvio,
    reenviar,
    enviando,
    enviar,
    microsoftCargando,
    entrarConMicrosoft,
  };
}

export type LoginController = ReturnType<typeof useLoginController>;
