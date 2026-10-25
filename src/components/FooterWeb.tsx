import { useEffect } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { avisarAltoFooterFijo } from '../lib/footerFijo';
import { AVISO_NO_OFICIAL } from '../models/legal';
import { cristalOscuro, glass } from '../theme/glass';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { PieLegal } from './PieLegal';

/**
 * Pie de la web en tablet y computador: aviso no oficial y enlaces legales en una barra de
 * cristal oscuro. En el teléfono no se pinta (allí los enlaces van dentro de cada pantalla).
 * `fijo`: el del Login de computador, pegado abajo; informa su alto para que el aviso de
 * cookies se ponga encima.
 */
export function FooterWeb({ style, conContacto = true, fijo }: { style?: StyleProp<ViewStyle>; conContacto?: boolean; fijo?: boolean }) {
  const { colors, type, spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const visible = breakpoint !== 'compacto';
  // Al irse (o pasar a teléfono) el aviso de cookies vuelve a su sitio.
  useEffect(() => {
    if (!fijo || !visible) return;
    return () => avisarAltoFooterFijo(0);
  }, [fijo, visible]);
  if (!visible) return null;

  const alMedir = fijo ? (e: LayoutChangeEvent) => avisarAltoFooterFijo(e.nativeEvent.layout.height) : undefined;
  return (
    <View
      role="contentinfo"
      onLayout={alMedir}
      style={[styles.pie, cristalOscuro(colors), { borderRadius: glass.panel, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }, style]}
    >
      <Text style={[type.bodyMuted, styles.aviso, { color: colors.onBackgroundMuted }]}>
        © {new Date().getFullYear()} USC<Text style={{ color: colors.accent }}>upo</Text> · {AVISO_NO_OFICIAL}
      </Text>
      <PieLegal sobreOscuro conContacto={conContacto} />
    </View>
  );
}

const styles = StyleSheet.create({
  pie: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  aviso: { flexGrow: 1, flexShrink: 1, flexBasis: 320, fontSize: 13 },
});
