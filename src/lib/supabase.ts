import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { crearAlmacenSesion } from './sesion';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo.'
  );
}

// El build de la web pinta cada ruta en Node (output "static"): ahí no hay window ni sesión.
const enServidor = typeof window === 'undefined';

// Web: localStorage o sessionStorage según "Mantener sesión iniciada" (ver ./sesion).
const almacenSesion =
  !enServidor && Platform.OS === 'web' ? crearAlmacenSesion(window.localStorage, window.sessionStorage) : null;

/** Según la casilla del login; se llama antes de iniciar sesión. */
export function recordarSesion(si: boolean) {
  almacenSesion?.recordar(si);
}

// La clave por defecto de supabase-js; también nombra el BroadcastChannel entre pestañas.
const CLAVE_SESION = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

/**
 * Supabase avisa a las otras pestañas cada inicio de sesión. Una pestaña sin la sesión guardada
 * (no se marcó "Mantener sesión iniciada") no debe adoptarla: solo se aceptan sesiones guardadas.
 */
export function sesionGuardadaAqui(): boolean {
  return almacenSesion ? almacenSesion.getItem(CLAVE_SESION) !== null : true;
}

/** true si la sesión recordada ya cumplió sus días (y la borra). */
export function sesionVencida(): boolean {
  return almacenSesion?.vencida() ?? false;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: enServidor ? undefined : (almacenSesion ?? AsyncStorage),
    autoRefreshToken: !enServidor,
    persistSession: !enServidor,
    // PKCE: el proveedor devuelve un ?code= de un solo uso en vez de tokens en la URL;
    // Supabase lo canjea al cargar /auth/callback.
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
});

export { DOMINIO_USC as USC_EMAIL_DOMAIN } from '../models/informacion';

// Proveedores externos activos en el proyecto (Authentication → Providers).
export async function proveedorHabilitado(proveedor: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey! } });
    if (!res.ok) return null;
    const ajustes = await res.json();
    return Boolean(ajustes?.external?.[proveedor]);
  } catch {
    return null; // Sin red: que el intento real muestre el error de conexión.
  }
}
