import { Redirect, Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { BarraNavegacion } from '../../src/components/BarraNavegacion';
import { useAuth } from '../../src/lib/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { perfilCompleto } from '../../src/models/perfiles';

type BarraProps = ComponentProps<typeof BarraNavegacion>;

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

export default function TabsLayout() {
  const { session, perfil, loading } = useAuth();
  const [rutaActiva, setRutaActiva] = useState(0);
  const pendientes = usePendientes(session?.user.id, rutaActiva);

  // "/" resuelve a (tabs)/index: redirigir ahí volvería a este layout en bucle.
  if (!loading && !session) return <Redirect href="/(auth)/login" />;
  if (!loading && !perfilCompleto(perfil)) return <Redirect href="/completar-perfil" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      screenListeners={{ state: (e) => setRutaActiva((e.data as { state: { index: number } }).state.index) }}
      tabBar={(props) => <BarraNavegacion {...(props as unknown as BarraProps)} pendientes={pendientes} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="publicar" options={{ title: 'Publicar' }} />
      <Tabs.Screen name="mis-cambios" options={{ title: 'Mis cambios' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
