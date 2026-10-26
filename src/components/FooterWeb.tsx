import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AVISO_NO_OFICIAL } from '../models/legal';
import { useAltoAviso } from '../lib/altoAviso';
import { cristalOscuro, glass } from '../theme/glass';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Logo } from './Logo';
import { PieLegal } from './PieLegal';

/**
 * Pie de la web en tablet y computador: isotipo, aviso no oficial y enlaces legales en una barra
 * de cristal oscuro. Va siempre al final del contenido, en el flujo (nunca encima de nada); si el
 * aviso de cookies está abierto, deja su alto libre debajo para que no lo tape. En el teléfono no
 * se pinta (allí los enlaces van dentro de cada pantalla).
 */
export function FooterWeb({ style, conContacto = true }: { style?: StyleProp<ViewStyle>; conContacto?: boolean }) {
  const { colors, type, spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const altoAviso = useAltoAviso();
  if (breakpoint === 'compacto') return null;

  return (
    <>
      <View
        role="contentinfo"
        style={[styles.pie, cristalOscuro(colors), { borderRadius: glass.panel, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }, style]}
      >
        <View style={[styles.marca, { gap: spacing.sm }]}>
          <Logo size={28} sobre="azul" />
          <Text style={[type.bodyMuted, styles.aviso, { color: colors.onBackgroundMuted }]}>
            © {new Date().getFullYear()} USC<Text style={{ color: colors.accent }}>upo</Text> · {AVISO_NO_OFICIAL}
          </Text>
        </View>
        <PieLegal sobreOscuro conContacto={conContacto} />
      </View>
      {altoAviso > 0 ? <View style={{ height: altoAviso }} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  pie: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  marca: { flexDirection: 'row', alignItems: 'center', flexGrow: 1, flexShrink: 1, flexBasis: 320 },
  aviso: { flexShrink: 1, fontSize: 13 },
});
