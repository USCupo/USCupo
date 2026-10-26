import Ionicons from './Iconos';
import { Link, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import { avisarAltoAviso } from '../lib/altoAviso';
import { useHidratado } from '../lib/useHidratado';
import type { PreferenciaAnuncios } from '../models/consentimientoAnuncios';
import { cristalOscuro, glass } from '../theme/glass';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

/**
 * Aviso de cookies y publicidad: panel de cristal flotante que no bloquea el uso. Hasta que el
 * visitante elija, los anuncios se piden no personalizados. Se reabre desde Perfil.
 */
export function AvisoCookies() {
  const { colors, type, spacing, minTouchSize } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const segmentos = useSegments();
  const { bannerVisible, preferencia, elegir, cerrar } = useConsentimientoAnuncios();
  // Entrada en CSS (data-entrada, app/+html.tsx): corre con el HTML del build sin esperar a JS.
  // "ssr" mientras viene del build: si ya había decisión, el CSS lo oculta hasta que se quite.
  const datos = { dataSet: { entrada: '', avisoCookies: useHidratado() ? 'cliente' : 'ssr' } } as object;

  // Al cerrarse, FooterWeb deja de reservarle espacio.
  useEffect(() => {
    if (!bannerVisible) return;
    return () => avisarAltoAviso(0);
  }, [bannerVisible]);

  if (!bannerVisible) return null;

  const amplio = breakpoint === 'amplio';
  // En el teléfono, dentro de las pestañas, va por encima del dock.
  const conDock = !amplio && segmentos[0] === '(tabs)';
  const abajo = insets.bottom + (conDock ? glass.altoBarraInferior + glass.margen * 2 : spacing.md);

  // Píldoras sobre el cristal oscuro, como los enlaces de la navbar; la elegida lleva aro amarillo.
  const opcion = (p: PreferenciaAnuncios, texto: string) => {
    const sel = preferencia === p;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: sel }}
        onPress={() => elegir(p)}
        style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [
          styles.opcion,
          {
            minHeight: minTouchSize,
            backgroundColor: hovered || sel ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
            borderColor: sel ? colors.accent : colors.onBackgroundBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {sel ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
        <Text style={[type.body, { color: colors.onBackground, fontFamily: fonts.bodyBold }]}>{texto}</Text>
      </Pressable>
    );
  };

  return (
    <View
      pointerEvents="box-none"
      onLayout={(e: LayoutChangeEvent) => avisarAltoAviso(e.nativeEvent.layout.height + abajo)}
      style={[styles.capa, { bottom: abajo, paddingHorizontal: amplio ? spacing.lg : spacing.md, alignItems: amplio ? 'flex-start' : 'stretch' }]}>
      <View
        {...datos}
        role="region"
        aria-label="Aviso de cookies y publicidad"
        style={[
          styles.panel,
          cristalOscuro(colors),
          {
            borderRadius: glass.panel,
            padding: spacing.md,
            gap: spacing.sm,
            maxWidth: amplio ? 440 : undefined,
          },
        ]}
      >
        <View style={styles.titulo}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
          <Text role="heading" aria-level={2} style={[type.body, { color: colors.accent, fontFamily: fonts.bodyBold, flex: 1 }]}>
            Cookies y publicidad
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso"
            onPress={cerrar}
            style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [
              styles.cerrar,
              { width: minTouchSize, height: minTouchSize, backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'transparent' },
            ]}
          >
            <Ionicons name="close" size={20} color={colors.onBackgroundMuted} />
          </Pressable>
        </View>
        <Text style={[type.bodyMuted, { color: colors.onBackground }]}>
          USCupo se financia con anuncios de Google AdSense, que usa cookies. Elige si pueden ser personalizados; mientras no
          elijas, son no personalizados.{' '}
          <Link href="/privacidad" style={{ color: colors.accent, fontFamily: fonts.bodyBold, textDecorationLine: 'underline' }}>
            Política de privacidad
          </Link>
        </Text>
        {preferencia ? (
          <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, fontSize: 13 }]}>Un cambio se aplica a los anuncios al recargar la página.</Text>
        ) : null}
        <View style={[styles.botones, { gap: spacing.sm }]}>
          {opcion('no_personalizados', 'No personalizados')}
          {opcion('personalizados', 'Personalizados')}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: 'fixed' as 'absolute', left: 0, right: 0, zIndex: 50 },
  panel: { width: '100%' },
  titulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cerrar: { alignItems: 'center', justifyContent: 'center', borderRadius: 999, marginVertical: -8, marginRight: -8 },
  botones: { flexDirection: 'row', flexWrap: 'wrap' },
  opcion: {
    flexGrow: 1,
    flexBasis: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: glass.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
});
