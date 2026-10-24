import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { GradientBackground } from '../../src/components/GradientBackground';
import { mensajeDeError } from '../../src/controllers/auth';
import { useAuth } from '../../src/lib/AuthContext';
import { cristalClaro, glass } from '../../src/theme/glass';
import { useTheme } from '../../src/theme/useTheme';
import { MetaPagina } from '../../src/components/MetaPagina';

// Retorno de Microsoft. Supabase canjea el ?code= al cargar la página (detectSessionInUrl);
// aquí solo se espera la sesión o se muestra el error que devolvió el proveedor.
export default function AuthCallback() {
  const { colors, spacing, type } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ error?: string; error_description?: string }>();
  const errorUrl = params.error_description ?? params.error;
  const [error, setError] = useState<string | undefined>(errorUrl ? mensajeDeError(new Error(errorUrl)) : undefined);

  // Si en 15 s no hay sesión ni error, el canje falló en silencio: ofrecer volver.
  useEffect(() => {
    if (session || error) return;
    const t = setTimeout(() => setError('No recibimos respuesta de Microsoft. Intenta de nuevo.'), 15000);
    return () => clearTimeout(t);
  }, [session, error]);

  if (session) return <Redirect href="/" />;

  return (
    <GradientBackground>
      <MetaPagina titulo="Iniciando sesión" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        {error ? (
          <View
            style={[
              cristalClaro(colors),
              { width: '100%', maxWidth: 420, borderRadius: glass.panel, padding: spacing.xl },
            ]}
          >
            <Text
              accessibilityRole="header"
              style={[type.sectionTitle, { color: colors.text, marginBottom: spacing.sm }]}
            >
              No pudimos iniciar sesión con Microsoft
            </Text>
            <Text role="alert" style={[type.body, { color: colors.textMuted, marginBottom: spacing.lg }]}>
              {error}
            </Text>
            <Button label="Volver al inicio de sesión" onPress={() => router.replace('/(auth)/login')} />
          </View>
        ) : (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, marginTop: spacing.sm }]}>
              Iniciando sesión…
            </Text>
          </>
        )}
      </View>
    </GradientBackground>
  );
}
