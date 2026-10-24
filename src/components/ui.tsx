import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cristalBoton, cristalClaro, glass } from '../theme/glass';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { GradientBackground } from './GradientBackground';

type IconName = ComponentProps<typeof Ionicons>['name'];

// ── Pantalla ─────────────────────────────────────────────────────────────────────
// Encabezado sobre el degradado institucional + contenido con ancho máximo legible.

interface PantallaProps {
  titulo: string;
  subtitulo?: string;
  acciones?: ReactNode;
  children: ReactNode;
  anchoMax?: number;
  onRefrescar?: () => void;
}

export function Pantalla({ titulo, subtitulo, acciones, children, anchoMax = 1080 }: PantallaProps) {
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const amplio = breakpoint === 'amplio';
  const gutter = breakpoint === 'compacto' ? spacing.md : spacing.xl;

  return (
    <GradientBackground>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          // La navbar flota encima (arriba en computador, abajo en teléfono): se reserva su alto.
          paddingTop: insets.top + (amplio ? glass.margen + glass.altoBarraSuperior + spacing.xl : spacing.lg),
          paddingBottom: insets.bottom + (amplio ? spacing.xxl : glass.margen + glass.altoBarraInferior + spacing.lg),
          paddingHorizontal: gutter,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: anchoMax }}>
          <View style={[styles.encabezado, { marginBottom: spacing.lg, paddingHorizontal: breakpoint === 'compacto' ? spacing.xs : 0 }]}>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.onBackground, fontSize: amplio ? 32 : 26, lineHeight: amplio ? 38 : 32 }]}>
                {titulo}
              </Text>
              {subtitulo ? (
                <Text style={[type.body, { color: colors.onBackgroundMuted, marginTop: spacing.xs }]}>{subtitulo}</Text>
              ) : null}
            </View>
            {acciones}
          </View>
          {children}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

// ── Tarjeta ──────────────────────────────────────────────────────────────────────

export function Tarjeta({ children, style, padding }: { children: ReactNode; style?: StyleProp<ViewStyle>; padding?: number }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={[
                cristalClaro(colors),
        { borderRadius: radius.card + 4, padding: padding ?? spacing.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TituloSeccion({ children, sobreFondo, accion }: { children: string; sobreFondo?: boolean; accion?: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.filaEntre, { marginBottom: spacing.sm, marginTop: spacing.xs }]}>
      <Text accessibilityRole="header" style={[type.cardTitle, { color: sobreFondo ? colors.onBackground : colors.text, fontSize: 17 }]}>
        {children}
      </Text>
      {accion}
    </View>
  );
}

// ── Insignias y chips ────────────────────────────────────────────────────────────

type TonoInsignia = 'match' | 'proceso' | 'neutro' | 'exito' | 'peligro';

export function Insignia({ texto, tono = 'neutro', icono }: { texto: string; tono?: TonoInsignia; icono?: IconName }) {
  const { colors, type } = useTheme();
  const paleta: Record<TonoInsignia, { bg: string; fg: string }> = {
    match: { bg: colors.accentTint, fg: colors.accentText },
    proceso: { bg: colors.primaryTint, fg: colors.link },
    neutro: { bg: colors.primaryTint, fg: colors.textMuted },
    exito: { bg: colors.primaryTint, fg: colors.link },
    peligro: { bg: colors.primaryTint, fg: colors.danger },
  };
  const { bg, fg } = paleta[tono];
  return (
    <View style={[styles.insignia, { backgroundColor: bg }]}>
      {icono ? <Ionicons name={icono} size={12} color={fg} /> : null}
      <Text style={[type.badge, { color: fg, letterSpacing: 0.2, fontSize: 12 }]}>{texto}</Text>
    </View>
  );
}

interface ChipProps {
  texto: string;
  activo?: boolean;
  onPress?: () => void;
  icono?: IconName;
  accessibilityLabel?: string;
}

export function Chip({ texto, activo, onPress, icono, accessibilityLabel }: ChipProps) {
  const { colors, type, radius } = useTheme();
  const contenido = (
    <>
      {icono ? <Ionicons name={icono} size={14} color={activo ? colors.onPrimary : colors.link} /> : null}
      <Text style={[type.bodyMuted, { color: activo ? colors.onPrimary : colors.text, fontFamily: 'Inter_700Bold' }]}>
        {texto}
      </Text>
    </>
  );
  const estilo = {
    backgroundColor: activo ? colors.primary : colors.surface,
    borderColor: activo ? colors.primary : colors.border,
    borderRadius: radius.control,
  };
  if (!onPress) return <View style={[styles.chip, estilo]}>{contenido}</View>;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!activo }}
      accessibilityLabel={accessibilityLabel ?? texto}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.chip,
        estilo,
        { minHeight: 40, opacity: pressed ? 0.8 : 1 },
        hovered && !activo ? { borderColor: colors.link } : null,
      ]}
    >
      {contenido}
    </Pressable>
  );
}

// ── Estados ──────────────────────────────────────────────────────────────────────

export function Cargando({ texto = 'Cargando…', sobreFondo }: { texto?: string; sobreFondo?: boolean }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.centro, { paddingVertical: spacing.xxl }]}>
      <ActivityIndicator color={sobreFondo ? colors.accent : colors.link} />
      <Text style={[type.bodyMuted, { color: sobreFondo ? colors.onBackgroundMuted : colors.textMuted, marginTop: spacing.sm }]}>
        {texto}
      </Text>
    </View>
  );
}

interface VacioProps {
  icono: IconName;
  titulo: string;
  texto?: string;
  accion?: { label: string; onPress: () => void };
}

export function EstadoVacio({ icono, titulo, texto, accion }: VacioProps) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.centro, { paddingVertical: spacing.xl, paddingHorizontal: spacing.md }]}>
      <View style={[styles.iconoVacio, { backgroundColor: colors.primaryTint }]}>
        <Ionicons name={icono} size={26} color={colors.link} />
      </View>
      <Text style={[type.cardTitle, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>{titulo}</Text>
      {texto ? (
        <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center', maxWidth: 380 }]}>
          {texto}
        </Text>
      ) : null}
      {accion ? (
        <View style={{ marginTop: spacing.md, minWidth: 200 }}>
          <Button label={accion.label} onPress={accion.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  const { colors, spacing, type } = useTheme();
  return (
    <Tarjeta>
      <Text role="alert" style={[type.body, { color: colors.danger }]}>
        {mensaje}
      </Text>
      <View style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}>
        <Button label="Reintentar" variant="secondary" onPress={onReintentar} />
      </View>
    </Tarjeta>
  );
}

// ── Diálogo de confirmación ──────────────────────────────────────────────────────

interface ConfirmarProps {
  visible: boolean;
  titulo: string;
  mensaje: string;
  confirmar: string;
  peligroso?: boolean;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function DialogoConfirmar({ visible, titulo, mensaje, confirmar, peligroso, cargando, onConfirmar, onCancelar }: ConfirmarProps) {
  const { colors, spacing, type, radius } = useTheme();
  const reducir = useReducedMotion();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    entrada.setValue(reducir ? 1 : 0);
    if (!reducir) animarResorte(entrada, 1, resorte.suave).start();
  }, [visible, reducir, entrada]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar} statusBarTranslucent>
      <View style={[styles.centro, { flex: 1, padding: spacing.lg }]}>
        <Pressable accessibilityLabel="Cancelar" onPress={onCancelar} style={[StyleSheet.absoluteFill, styles.scrim]} />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.dialogo,
            cristalClaro(colors),
            {
              borderRadius: radius.card + 4,
              padding: spacing.lg,
              opacity: entrada,
              transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
            },
          ]}
        >
          <Text accessibilityRole="header" style={[type.sectionTitle, { color: colors.text }]}>
            {titulo}
          </Text>
          <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.sm }]}>{mensaje}</Text>
          <View style={[styles.filaBotones, { marginTop: spacing.lg }]}>
            <View style={{ flex: 1 }}>
              <Button label="Cancelar" variant="secondary" onPress={onCancelar} disabled={cargando} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={confirmar}
                onPress={onConfirmar}
                loading={cargando}
                loadingLabel="Un momento…"
                style={peligroso ? { backgroundColor: colors.danger } : undefined}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Aviso temporal (toast) ───────────────────────────────────────────────────────

export function Aviso({ mensaje, onCerrar }: { mensaje: string | null; onCerrar: () => void }) {
  const { colors, spacing, type, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { breakpoint } = useBreakpoint();

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(onCerrar, 4000);
    return () => clearTimeout(t);
  }, [mensaje, onCerrar]);

  if (!mensaje) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[styles.avisoCapa, { bottom: insets.bottom + (breakpoint === 'amplio' ? spacing.xl : 88) }]}
    >
      <View
        accessibilityLiveRegion="polite"
        role="status"
        style={[styles.aviso, cristalBoton(colors.text), { borderRadius: radius.card, padding: spacing.md }]}
      >
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
        <Text style={[type.body, { color: colors.surface, flex: 1 }]}>{mensaje}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    flexWrap: 'wrap',
  },
  filaEntre: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  insignia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoVacio: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    backgroundColor: 'rgba(3, 10, 24, 0.55)',
  },
  dialogo: {
    width: '100%',
    maxWidth: 440,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: 12,
  },
  avisoCapa: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 520,
    width: '100%',
  },
});
