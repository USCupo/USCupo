import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import { AVISO_NO_OFICIAL } from '../models/legal';
import { cristalOscuro, glass } from '../theme/glass';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';

/**
 * Pie de la web en tablet y computador: aviso no oficial y enlaces legales en una barra de
 * cristal oscuro. En el teléfono no se pinta (allí los enlaces van dentro de cada pantalla).
 */
export function FooterWeb({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors, type, spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const { abrirOpciones } = useConsentimientoAnuncios();
  if (breakpoint === 'compacto') return null;

  const enlace = [type.bodyMuted, styles.enlace, { color: colors.onBackground }];
  return (
    <View
      role="contentinfo"
      style={[styles.pie, cristalOscuro(colors), { borderRadius: glass.panel, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }, style]}
    >
      <Text style={[type.bodyMuted, styles.aviso, { color: colors.onBackgroundMuted }]}>
        © {new Date().getFullYear()} USC<Text style={{ color: colors.accent }}>upo</Text> · {AVISO_NO_OFICIAL}
      </Text>
      <View role="navigation" aria-label="Información legal" style={styles.enlaces}>
        <Link href="/terminos" style={enlace}>
          Términos de uso
        </Link>
        <Link href="/privacidad" style={enlace}>
          Política de privacidad
        </Link>
        <Pressable accessibilityRole="button" onPress={abrirOpciones}>
          <Text style={enlace}>Opciones de privacidad de anuncios</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pie: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  aviso: { flexGrow: 1, flexShrink: 1, flexBasis: 320, fontSize: 13 },
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  enlace: { textDecorationLine: 'underline', paddingVertical: 10, fontFamily: 'Inter_700Bold', fontSize: 13 },
});
