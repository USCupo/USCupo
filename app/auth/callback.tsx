import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { GradientBackground } from '../../src/components/GradientBackground';
import { completarSesionDesdeUrl, hayCanjeEnCurso, mensajeDeError } from '../../src/controllers/auth';
import { useAuth } from '../../src/lib/AuthContext';
import { useTheme } from '../../src/theme/useTheme';

// Retorno de Microsoft. En web, Supabase ya canjeó el ?code= al cargar la página; en
// iOS/Android solo se canjea aquí si la app se abrió en frío desde el enlace.
export default function AuthCallback() {
  const { colors, spacing, type } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const errorUrl = params.error_description ?? params.error;
  const [error, setError] = useState<string | undefined>(errorUrl ? mensajeDeError(new Error(errorUrl)) : undefined);

  useEffect(() => {
    if (Platform.OS === 'web' || session || error || !params.code || hayCanjeEnCurso()) return;
    completarSesionDesdeUrl(`uscupo://auth/callback?code=${encodeURIComponent(params.code)}`).catch((e) =>
      setError(mensajeDeError(e)),
    );
  }, [params.code, session, error]);

  // Si en 15 s no hay sesión ni error, el canje falló en silencio: ofrecer volver.
  useEffect(() => {
    if (session || error) return;
    const t = setTimeout(() => setError('No recibimos respuesta de Microsoft. Intenta de nuevo.'), 15000);
    return () => clearTimeout(t);
  }, [session, error]);

  if (session) return <Redirect href="/" />;

  return (
    <GradientBackground>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
        {error ? (
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: colors.surface,
              borderRadius: 24,
              padding: spacing.xl,
            }}
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
