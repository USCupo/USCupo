import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../src/lib/AuthContext';
import { perfilCompleto } from '../src/models/perfiles';
import { useTheme } from '../src/theme/useTheme';

// Punto de entrada: decide a dónde va el usuario según su sesión y su perfil.
export default function Index() {
  const { session, perfil, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!perfilCompleto(perfil)) return <Redirect href="/completar-perfil" />;
  return <Redirect href="/(tabs)" />;
}
