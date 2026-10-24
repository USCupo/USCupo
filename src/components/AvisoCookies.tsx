import { Ionicons } from '@expo/vector-icons';
import { Link, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import type { PreferenciaAnuncios } from '../models/consentimientoAnuncios';
import { cristalClaro, glass } from '../theme/glass';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';

/**
 * Aviso de cookies y publicidad: panel de cristal flotante que no bloquea el uso. Hasta que el
 * visitante elija, los anuncios se piden no personalizados. Se reabre desde Perfil.
 */
export function AvisoCookies() {
  const { colors, type, spacing, minTouchSize } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const segmentos = useSegments();
  const reducir = useReducedMotion();
  const { bannerVisible, preferencia, elegir, cerrar } = useConsentimientoAnuncios();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!bannerVisible) return;
    entrada.setValue(reducir ? 1 : 0);
    if (!reducir) animarResorte(entrada, 1, resorte.suave).start();
  }, [bannerVisible, reducir, entrada]);

  if (!bannerVisible) return null;

  const amplio = breakpoint === 'amplio';
  // En el teléfono, dentro de las pestañas, va por encima del dock.
  const conDock = !amplio && segmentos[0] === '(tabs)';
  const abajo = insets.bottom + (conDock ? glass.altoBarraInferior + glass.margen * 2 : spacing.md);

  const opcion = (p: PreferenciaAnuncios, texto: string) => (
    <Button
      label={preferencia === p ? `${texto} ✓` : texto}
      variant="secondary"
      onPress={() => elegir(p)}
      style={{ flexGrow: 1, flexBasis: 160 }}
    />
  );

  return (
    <View pointerEvents="box-none" style={[styles.capa, { bottom: abajo, paddingHorizontal: amplio ? spacing.lg : spacing.md, alignItems: amplio ? 'flex-start' : 'stretch' }]}>
      <Animated.View
        role="region"
        aria-label="Aviso de cookies y publicidad"
        style={[
          styles.panel,
          cristalClaro(colors),
          {
            borderRadius: glass.panel,
            padding: spacing.md,
            gap: spacing.sm,
            maxWidth: amplio ? 440 : undefined,
            opacity: entrada,
            transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
        <View style={styles.titulo}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.link} />
          <Text accessibilityRole="header" style={[type.body, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1 }]}>
            Cookies y publicidad
          </Text>
          {preferencia ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar aviso"
              onPress={cerrar}
              style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [
                styles.cerrar,
                { width: minTouchSize, height: minTouchSize, backgroundColor: hovered ? colors.primaryTint : 'transparent' },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
          USCupo se financia con anuncios de Google AdSense, que usa cookies. Elige si pueden ser personalizados; mientras no
          elijas, son no personalizados.{' '}
          <Link href="/privacidad" style={{ color: colors.link, fontFamily: 'Inter_700Bold', textDecorationLine: 'underline' }}>
            Política de privacidad
          </Link>
        </Text>
        <View style={[styles.botones, { gap: spacing.sm }]}>
          {opcion('no_personalizados', 'No personalizados')}
          {opcion('personalizados', 'Personalizados')}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: 'fixed' as 'absolute', left: 0, right: 0, zIndex: 50 },
  panel: { width: '100%' },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cerrar: { alignItems: 'center', justifyContent: 'center', borderRadius: 999, marginVertical: -8, marginRight: -8 },
  botones: { flexDirection: 'row', flexWrap: 'wrap' },
});
