import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { obtenerPerfilPropio } from '../models/perfiles';
import type { Profile } from '../models/types';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  perfil: Profile | null;
  /** true mientras se resuelve la sesión inicial o se carga el perfil de la sesión actual. */
  loading: boolean;
  recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  perfil: null,
  loading: true,
  recargarPerfil: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLista, setSessionLista] = useState(false);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [perfilDe, setPerfilDe] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLista(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setSessionLista(true);
    });

    return () => subscription.subscription.unsubscribe();
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
    <AuthContext.Provider value={{ session, perfil, loading, recargarPerfil }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
