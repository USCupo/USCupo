import { proveedorHabilitado, recordarSesion, supabase, USC_EMAIL_DOMAIN } from '../lib/supabase';
import { cacheCatalogo } from '../models/catalogo';

// Acceso exclusivo con cuentas institucionales @usc.edu.co: cuenta Microsoft 365 de la USC
// o correo institucional + contraseña. El trigger handle_new_user en la base de datos
// repite la validación del dominio, así que ninguna otra cuenta llega a crear perfil.

const domainPattern = new RegExp(`^[^@\\s]+@${USC_EMAIL_DOMAIN.replace('.', '\\.')}$`, 'i');

export const MIN_CONTRASENA = 8;

export function esCorreoInstitucional(correo: string): boolean {
  return domainPattern.test(correo.trim());
}

export function errorCorreo(correo: string): string | undefined {
  if (!correo.trim()) return 'Escribe tu correo institucional';
  if (!esCorreoInstitucional(correo)) return `Usa tu correo institucional, terminado en @${USC_EMAIL_DOMAIN}`;
  return undefined;
}

export function errorContrasena(contrasena: string): string | undefined {
  if (contrasena.length < MIN_CONTRASENA) return `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres`;
  return undefined;
}

export function errorNombre(nombre: string): string | undefined {
  if (nombre.trim().length < 3) return 'Escribe tu nombre completo';
  return undefined;
}

// Traduce los errores de red y de Supabase Auth a mensajes que dicen qué pasó y qué hacer.
export function mensajeDeError(e: unknown): string {
  // Supabase devuelve `error` como objeto plano ({ message, code, ... }), no como Error:
  // String() lo convertiría en "[object Object]".
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === 'object' && e !== null && typeof (e as { message?: unknown }).message === 'string'
        ? (e as { message: string }).message
        : typeof e === 'string'
          ? e
          : '';
  const msg = raw.toLowerCase();

  // Safari dice "Load failed" donde Chrome dice "Failed to fetch".
  if (msg.includes('failed to fetch') || msg.includes('load failed') || msg.includes('network request failed') || msg.includes('fetch failed')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('email not confirmed')) {
    return 'Confirma tu cuenta desde el enlace que enviamos a tu correo institucional.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  }
  if (msg.includes('email address not authorized')) {
    return 'Por ahora no podemos enviar correos a esa dirección. Escríbenos desde Contacto y te ayudamos.';
  }
  if (msg.includes('email rate limit')) {
    return 'Ya enviamos varios correos en la última hora. Espera un rato antes de pedir otro enlace.';
  }
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
  if (msg.includes('for security purposes')) return 'Espera un minuto antes de pedir otro enlace.';
  if (msg.includes('should be different from the old password')) {
    return 'La nueva contraseña debe ser distinta de la anterior.';
  }
  if (msg.includes('weak') || msg.includes('password should')) {
    return 'Esa contraseña es muy fácil de adivinar. Usa una más larga o mezcla letras, números y símbolos.';
  }
  if (msg.includes('auth session missing') || msg.includes('otp_expired') || msg.includes('invalid or has expired')) {
    return 'El enlace ya venció o ya se usó. Pide uno nuevo.';
  }
  if (msg.includes('database error saving new user') || msg.includes('solo para correos institucionales')) {
    return `Esa cuenta de Microsoft no es institucional. Entra con tu cuenta @${USC_EMAIL_DOMAIN}.`;
  }
  if (msg.includes('aadsts65001') || msg.includes('aadsts90094') || msg.includes('admin approval') || msg.includes('consent')) {
    return 'La USC aún no ha autorizado a USCupo en su Microsoft 365. Mientras tanto, usa tu correo y contraseña.';
  }
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
    return 'El acceso con Microsoft todavía no está activado. Usa tu correo y contraseña.';
  }
  return raw || 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export interface DatosRegistro {
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  carreraId: number;
  /** Versión de términos y política aceptada en el formulario; el trigger de alta la guarda con la hora. */
  legalVersion: string;
}

export async function registrarse({ nombreCompleto, correo, contrasena, carreraId, legalVersion }: DatosRegistro) {
  if (!esCorreoInstitucional(correo)) {
    throw new Error(`Usa tu correo institucional, terminado en @${USC_EMAIL_DOMAIN}`);
  }

  // Si la confirmación por correo está apagada, signUp ya abre sesión: solo en esta pestaña.
  recordarSesion(false);
  const { data, error } = await supabase.auth.signUp({
    email: correo.trim().toLowerCase(),
    password: contrasena,
    options: {
      data: {
        nombre_completo: nombreCompleto.trim(),
        carrera_id: String(carreraId),
        legal_version: legalVersion,
      },
    },
  });

  if (error) throw error;
  // Con confirmación por correo activa, Supabase no da error si el correo ya existe:
  // responde un usuario sin identidades. Se trata como cuenta existente.
  if (data.user && data.user.identities?.length === 0) throw new Error('User already registered');
  return data;
}

/** Con "Confirm email" activo: otro enlace para quien no recibió o perdió el primero. */
export async function reenviarConfirmacion(correo: string) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: correo.trim().toLowerCase() });
  if (error) throw error;
}

export async function iniciarSesion(correo: string, contrasena: string, recordar: boolean) {
  if (!esCorreoInstitucional(correo)) {
    throw new Error(`Usa tu correo institucional, terminado en @${USC_EMAIL_DOMAIN}`);
  }

  recordarSesion(recordar);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: contrasena,
  });

  if (error) throw error;
  return data;
}

// ── Microsoft 365 (Azure / Entra ID) ───────────────────────────────────────────────
// domain_hint lleva directo al inicio de sesión de la USC; si el navegador ya tiene la
// sesión de Microsoft abierta, entra sin pedir nada (inicio de sesión automático).

const RUTA_CALLBACK = 'auth/callback';

/** La página navega a Microsoft; al volver, Supabase canjea el ?code= en /auth/callback. */
export async function iniciarSesionConMicrosoft(recordar: boolean, correoSugerido?: string): Promise<void> {
  if ((await proveedorHabilitado('azure')) === false) throw new Error('provider is not enabled');

  // Antes de salir hacia Microsoft: el ?code= se canjea al volver y la sesión se guarda donde diga la casilla.
  recordarSesion(recordar);
  const redirectTo = `${window.location.origin}/${RUTA_CALLBACK}`;
  const queryParams: Record<string, string> = { domain_hint: USC_EMAIL_DOMAIN };
  if (correoSugerido && esCorreoInstitucional(correoSugerido)) {
    queryParams.login_hint = correoSugerido.trim().toLowerCase();
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email', redirectTo, queryParams },
  });
  if (error) throw error;
}

// ── Recuperar la contraseña ────────────────────────────────────────────────────────
// Supabase envía un enlace a /restablecer. Allí se canjea (?code= o ?token_hash=) por una sesión
// de recuperación y se elige la contraseña nueva. Por seguridad la respuesta es la misma exista o
// no la cuenta. Las cuentas que entran con Microsoft no tienen contraseña en USCupo.

export const RUTA_RESTABLECER = '/restablecer';

export async function enviarRecuperacion(correo: string) {
  if (!esCorreoInstitucional(correo)) {
    throw new Error(`Usa tu correo institucional, terminado en @${USC_EMAIL_DOMAIN}`);
  }
  const { error } = await supabase.auth.resetPasswordForEmail(correo.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}${RUTA_RESTABLECER}`,
  });
  if (error) throw error;
}

/** Canje del enlace con la plantilla de correo de token_hash (sirve aunque se abra en otro navegador). */
export async function verificarEnlaceRecuperacion(tokenHash: string) {
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
  if (error) throw error;
}

export async function cambiarContrasena(nueva: string) {
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) throw error;
  // Quien conociera la contraseña anterior pierde las sesiones abiertas en otros equipos.
  await supabase.auth.signOut({ scope: 'others' });
}

export async function cerrarSesion() {
  cacheCatalogo.vaciar();
  const { error } = await supabase.auth.signOut();
  // Si el servidor no responde (sin red, o la cuenta ya se borró) igual se cierra en este equipo.
  if (error) await supabase.auth.signOut({ scope: 'local' });
  recordarSesion(false);
}
