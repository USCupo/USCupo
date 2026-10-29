import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { FooterWeb } from '../src/components/FooterWeb';
import { GradientBackground } from '../src/components/GradientBackground';
import { Logo } from '../src/components/Logo';
import { MetaPagina, metadatos } from '../src/components/MetaPagina';
import { cristalClaro, glass } from '../src/theme/glass';
import { useTheme } from '../src/theme/useTheme';

// Ruta desconocida. En producción Vercel la sirve con estado 404 (404.html es la misma app).

export const generateMetadata = () => metadatos({ titulo: 'Página no encontrada' });

export default function NoEncontrada() {
  const { colors, spacing, type } = useTheme();
  const router = useRouter();

  return (
    <GradientBackground>
      <MetaPagina titulo="Página no encontrada" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.xl }}>
        <Logo size={56} sobre="azul" />
        <View style={[cristalClaro(colors), { width: '100%', maxWidth: 440, borderRadius: glass.panel, padding: spacing.xl, alignItems: 'center' }]}>
          <Text accessibilityRole="header" style={[type.sectionTitle, { color: colors.text, textAlign: 'center' }]}>
            Esta página no existe
          </Text>
          <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg, textAlign: 'center' }]}>
            Puede que el enlace esté mal escrito o que la página ya no esté.
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <Button label="Ir al inicio" onPress={() => router.replace('/')} />
          </View>
        </View>
        <View style={{ width: '100%', maxWidth: 1080 }}>
          <FooterWeb />
        </View>
      </View>
    </GradientBackground>
  );
}
