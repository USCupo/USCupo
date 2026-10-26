import { Redirect } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { BrandPanel } from '../src/components/BrandPanel';
import { GradientBackground } from '../src/components/GradientBackground';
import { MetaPagina } from '../src/components/MetaPagina';
import { useAuth } from '../src/lib/AuthContext';
import { perfilCompleto, legalVigente } from '../src/models/perfiles';
import { useTheme } from '../src/theme/useTheme';

// Punto de entrada: decide a dónde va el usuario según su sesión y su perfil. Mientras lo
// averigua (y en el HTML del build, que leen buscadores y agentes) muestra qué es USCupo.
export default function Index() {
  const { session, perfil, loading } = useAuth();
  const { colors, spacing } = useTheme();

  if (loading) {
    return (
      <GradientBackground>
        <MetaPagina
          titulo="Cambios de horario entre estudiantes USC"
          ruta="/"
          descripcion="Encuentra a alguien que quiera tu horario y te dé el suyo. Bolsa de intercambio de cupos entre estudiantes de la Universidad Santiago de Cali, solo con correo @usc.edu.co. Proyecto independiente, no oficial."
        />
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <BrandPanel descripcion />
          <View style={{ alignItems: 'center', paddingBottom: spacing.xl }}>
            <ActivityIndicator color={colors.accent} accessibilityLabel="Cargando" />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!legalVigente(perfil)) return <Redirect href="/aceptar-legal" />;
  if (!perfilCompleto(perfil)) return <Redirect href="/completar-perfil" />;
  return <Redirect href="/(tabs)" />;
}
