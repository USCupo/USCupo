import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { proveedorHabilitado, supabase, USC_EMAIL_DOMAIN } from '../lib/supabase';

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
  const raw = e instanceof Error ? e.message : String(e ?? '');
  const msg = raw.toLowerCase();

  if (msg.includes('failed to fetch') || msg.includes('network request failed') || msg.includes('fetch failed')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('email not confirmed')) {
    return 'Confirma tu cuenta desde el enlace que enviamos a tu correo institucional.';
  }
  if (msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  }
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
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
}

export async function registrarse({ nombreCompleto, correo, contrasena, carreraId }: DatosRegistro) {
  if (!esCorreoInstitucional(correo)) {
    throw new Error(`Usa tu correo institucional, terminado en @${USC_EMAIL_DOMAIN}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email: correo.trim().toLowerCase(),
    password: contrasena,
    options: {
      data: {
        nombre_completo: nombreCompleto.trim(),
        carrera_id: String(carreraId),
      },
    },
  });

  if (error) throw error;
  // Con confirmación por correo activa, Supabase no da error si el correo ya existe:
  // responde un usuario sin identidades. Se trata como cuenta existente.
  if (data.user && data.user.identities?.length === 0) throw new Error('User already registered');
  return data;
}

export async function iniciarSesion(correo: string, contrasena: string) {
  if (!esCorreoInstitucional(correo)) {
    throw new Error(`Usa tu correo institucional, terminado en @${USC_EMAIL_DOMAIN}`);
  }

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

function urlDeRetorno(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/${RUTA_CALLBACK}`;
  return makeRedirectUri({ scheme: 'uscupo', path: RUTA_CALLBACK });
}

let canjeEnCurso = false;
export const hayCanjeEnCurso = () => canjeEnCurso;

/** Devuelve false si el usuario cerró el navegador sin terminar. En web la página navega a Microsoft. */
export async function iniciarSesionConMicrosoft(correoSugerido?: string): Promise<boolean> {
  if ((await proveedorHabilitado('azure')) === false) throw new Error('provider is not enabled');

  const redirectTo = urlDeRetorno();
  const queryParams: Record<string, string> = { domain_hint: USC_EMAIL_DOMAIN };
  if (correoSugerido && esCorreoInstitucional(correoSugerido)) {
    queryParams.login_hint = correoSugerido.trim().toLowerCase();
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      scopes: 'email',
      redirectTo,
      queryParams,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });
  if (error) throw error;
  if (Platform.OS === 'web') return true;

  canjeEnCurso = true;
  try {
    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (resultado.type !== 'success') return false;
    await completarSesionDesdeUrl(resultado.url);
    return true;
  } finally {
    canjeEnCurso = false;
  }
}

/** Lee ?code= (o el error) que Supabase deja en la URL de retorno y abre la sesión. */
export async function completarSesionDesdeUrl(url: string): Promise<void> {
  const params = parametrosDeUrl(url);
  const errorProveedor = params.get('error_description') ?? params.get('error');
  if (errorProveedor) throw new Error(errorProveedor);

  const code = params.get('code');
  if (!code) throw new Error('Microsoft no devolvió un código de acceso. Intenta de nuevo.');

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

function parametrosDeUrl(url: string): URLSearchParams {
  // Supabase puede devolver los parámetros en la query (?code=) o en el fragmento (#error=).
  const params = new URLSearchParams();
  const [sinHash, hash = ''] = url.split('#');
  const query = sinHash.includes('?') ? sinHash.slice(sinHash.indexOf('?') + 1) : '';
  for (const parte of [query, hash]) {
    new URLSearchParams(parte).forEach((v, k) => params.set(k, v));
  }
  return params;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
