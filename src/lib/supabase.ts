import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env y complétalo.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // PKCE: el proveedor devuelve un ?code= de un solo uso en vez de tokens en la URL;
    // Supabase lo canjea al cargar /auth/callback.
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
});

export const USC_EMAIL_DOMAIN = 'usc.edu.co';

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
