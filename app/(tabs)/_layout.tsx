import { Redirect, router, Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BarraNavegacion } from '../../src/components/BarraNavegacion';
import { GradientBackground } from '../../src/components/GradientBackground';
import { useAuth } from '../../src/lib/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { legalVigente, perfilCompleto } from '../../src/models/perfiles';

// Avisos sin leer (interés recibido, cambio confirmado…) para el contador de "Mis cambios".
function usePendientes(userId: string | undefined, rutaActiva: number) {
  const [n, setN] = useState(0);
  const cargar = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from('notificaciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('leida', false);
    setN(count ?? 0);
  }, [userId]);
  useEffect(() => {
    cargar();
  }, [cargar, rutaActiva]);
  return n;
}

const PESTANAS = ['/(tabs)', '/(tabs)/buscar', '/(tabs)/publicar', '/(tabs)/mis-cambios', '/(tabs)/perfil'] as const;

// Con asyncRoutes, el código de cada pestaña llega la primera vez que se abre. Cuando el navegador
// queda libre se precargan todas: el cambio de pestaña ya no espera la red. Las pantallas piden
// sus datos al ganar foco (useCargaEnFoco), así que precargar no consulta Supabase.
function usePrecargarPestanas(listo: boolean) {
  useEffect(() => {
    if (!listo || typeof window === 'undefined') return;
    const precargar = () => PESTANAS.forEach((ruta) => router.prefetch(ruta));
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(precargar, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(precargar, 1500);
    return () => clearTimeout(id);
  }, [listo]);
}

export default function TabsLayout() {
  const { session, perfil, loading } = useAuth();
  const [rutaActiva, setRutaActiva] = useState(0);
  const pendientes = usePendientes(session?.user.id, rutaActiva);
  usePrecargarPestanas(!loading && !!session && legalVigente(perfil) && perfilCompleto(perfil));

  // Sin sesión todavía no se pintan las pestañas: cada pantalla pediría sus datos con un usuario
  // vacío (400) antes de redirigir. Con sesión se pintan ya, mientras llega el perfil.
  if (!session) return loading ? <GradientBackground>{null}</GradientBackground> : <Redirect href="/(auth)/login" />;
  // "/" resuelve a (tabs)/index: redirigir ahí volvería a este layout en bucle.
  if (!loading && !legalVigente(perfil)) return <Redirect href="/aceptar-legal" />;
  if (!loading && !perfilCompleto(perfil)) return <Redirect href="/completar-perfil" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      screenListeners={{ state: (e) => setRutaActiva((e.data as { state: { index: number } }).state.index) }}
      tabBar={(props) => <BarraNavegacion {...props} pendientes={pendientes} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="publicar" options={{ title: 'Publicar' }} />
      <Tabs.Screen name="mis-cambios" options={{ title: 'Mis cambios' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
