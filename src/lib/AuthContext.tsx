import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import { RUTA_RESTABLECER } from '../controllers/auth';
import { obtenerPerfilPropio } from '../models/perfiles';
import type { Profile } from '../models/types';
import { sesionGuardadaAqui, sesionVencida, supabase } from './supabase';

interface AuthState {
  session: Session | null;
  perfil: Profile | null;
  /** true mientras se resuelve la sesión inicial o se carga el perfil de la sesión actual. */
  loading: boolean;
  /** La sesión viene de un enlace de recuperación: falta elegir la contraseña nueva. */
  recuperando: boolean;
  recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  perfil: null,
  loading: true,
  recuperando: false,
  recargarPerfil: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLista, setSessionLista] = useState(false);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [perfilDe, setPerfilDe] = useState<string | null>(null);
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLista(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession && !sesionGuardadaAqui()) return;
      if (event === 'PASSWORD_RECOVERY') {
        setRecuperando(true);
        // Si Supabase no aceptó la ruta de redirección, el enlace cae en la página principal.
        if (window.location.pathname !== RUTA_RESTABLECER) router.replace(RUTA_RESTABLECER);
      } else if (event === 'SIGNED_OUT') {
        setRecuperando(false);
      }
      setSession(newSession);
      setSessionLista(true);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Una pestaña abierta varios días: al volver a ella se revisa si la sesión recordada ya venció.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const revisar = () => {
      if (document.visibilityState === 'visible' && sesionVencida()) supabase.auth.signOut({ scope: 'local' });
    };
    document.addEventListener('visibilitychange', revisar);
    return () => document.removeEventListener('visibilitychange', revisar);
  }, []);

  const userId = session?.user.id ?? null;

  const cargarPerfil = useCallback(async (id: string | null) => {
    if (!id) {
      setPerfil(null);
      setPerfilDe(null);
      return;
    }
    try {
      setPerfil(await obtenerPerfilPropio(id));
    } catch {
      setPerfil(null);
    } finally {
      setPerfilDe(id);
    }
  }, []);

  useEffect(() => {
    cargarPerfil(userId);
  }, [userId, cargarPerfil]);

  const recargarPerfil = useCallback(() => cargarPerfil(userId), [cargarPerfil, userId]);

  const loading = !sessionLista || (userId !== null && perfilDe !== userId);

  return (
    <AuthContext.Provider value={{ session, perfil, loading, recuperando, recargarPerfil }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
