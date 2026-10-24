import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { agruparPorFacultad, filtrarCarreras } from '../models/carreras';
import type { Carrera } from '../models/types';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useBreakpoint } from '../theme/useBreakpoint';
import { cristalClaro } from '../theme/glass';
import { useTheme } from '../theme/useTheme';
import { TextField } from './TextField';

interface Props {
  label: string;
  carreras: Carrera[];
  cargando?: boolean;
  selectedId: number | null;
  onSelect: (carrera: Carrera) => void;
  error?: string;
}

const TIPO: Record<Carrera['tipo'], string> = {
  pregrado: 'Pregrado',
  tecnico: 'Técnico / tecnológico',
  posgrado: 'Posgrado',
};

export function CarreraPicker({ label, carreras, cargando, selectedId, onSelect, error }: Props) {
  const { colors, radius, spacing, type, minTouchSize } = useTheme();
  const { breakpoint, height } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const reducir = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const entrada = useRef(new Animated.Value(0)).current;

  const comoDialogo = breakpoint !== 'compacto';
  const seleccionada = carreras.find((c) => c.id === selectedId) ?? null;
  const secciones = useMemo(() => agruparPorFacultad(filtrarCarreras(carreras, busqueda)), [carreras, busqueda]);

  useEffect(() => {
    if (!open) return;
    entrada.setValue(reducir ? 1 : 0);
    if (!reducir) animarResorte(entrada, 1, resorte.suave).start();
  }, [open, reducir, entrada]);

  function cerrar() {
    setOpen(false);
    setBusqueda('');
  }

  // Hoja desde abajo en teléfono; diálogo que crece desde el centro en pantallas grandes.
  const panelAnim = comoDialogo
    ? {
        opacity: entrada,
        transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
      }
    : { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: 'Inter_700Bold', marginBottom: spacing.xs }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${seleccionada ? seleccionada.nombre : 'sin elegir'}`}
        accessibilityHint="Abre la lista de carreras"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            minHeight: minTouchSize + 4,
            borderRadius: radius.control,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={{ flex: 1, paddingVertical: spacing.sm }}>
          <Text
            numberOfLines={1}
            style={[type.body, { color: seleccionada ? colors.text : colors.textMuted }]}
          >
            {seleccionada ? seleccionada.nombre : 'Elige tu carrera'}
          </Text>
          {seleccionada ? (
            <Text numberOfLines={1} style={[type.bodyMuted, { color: colors.textMuted }]}>
              {seleccionada.facultad}, sede {seleccionada.sede}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={cerrar} statusBarTranslucent>
        <View style={[styles.overlay, comoDialogo ? styles.overlayCentro : styles.overlayAbajo]}>
          <Pressable accessibilityLabel="Cerrar lista de carreras" onPress={cerrar} style={styles.scrim} />
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.panel,
              cristalClaro(colors),
              comoDialogo
                ? { width: '92%', maxWidth: 560, height: Math.min(height * 0.8, 720), borderRadius: radius.card + 4 }
                : {
                    height: height - insets.top - spacing.lg,
                    borderTopLeftRadius: radius.card + 4,
                    borderTopRightRadius: radius.card + 4,
                    paddingBottom: insets.bottom,
                  },
              panelAnim,
            ]}
          >
            {!comoDialogo && <View style={[styles.grabber, { backgroundColor: colors.border }]} />}
            <View style={[styles.cabecera, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
              <Text style={[type.sectionTitle, { color: colors.text, flex: 1 }]}>¿Qué carrera estudias?</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={cerrar}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.cerrar,
                  { backgroundColor: colors.primaryTint, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.link} />
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
              <TextField
                label="Buscar"
                placeholder="Ingeniería, Derecho, Palmira…"
                value={busqueda}
                onChangeText={setBusqueda}
                autoCorrect={false}
                autoFocus={comoDialogo}
              />
            </View>

            {cargando ? (
              <View style={styles.estado}>
                <ActivityIndicator color={colors.link} />
                <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.sm }]}>
                  Cargando carreras…
                </Text>
              </View>
            ) : (
              <SectionList
                sections={secciones}
                keyExtractor={(item) => String(item.id)}
                keyboardShouldPersistTaps="handled"
                stickySectionHeadersEnabled
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
                ListEmptyComponent={
                  <View style={styles.estado}>
                    <Text style={[type.body, { color: colors.text, textAlign: 'center' }]}>
                      {busqueda ? `Ninguna carrera coincide con “${busqueda.trim()}”` : 'No hay carreras disponibles'}
                    </Text>
                    <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }]}>
                      {busqueda ? 'Prueba con otra palabra o con el nombre de la facultad.' : 'Intenta de nuevo en un momento.'}
                    </Text>
                  </View>
                }
                renderSectionHeader={({ section }) => (
                  <Text
                    accessibilityRole="header"
                    style={[
                      type.bodyMuted,
                      {
                        color: colors.textMuted,
                        fontFamily: 'Inter_700Bold',
                        backgroundColor: colors.surface,
                        paddingTop: spacing.md,
                        paddingBottom: spacing.sm,
                      },
                    ]}
                  >
                    {section.title}
                  </Text>
                )}
                renderItem={({ item }) => {
                  const active = item.id === selectedId;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => {
                        onSelect(item);
                        cerrar();
                      }}
                      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                        styles.option,
                        {
                          minHeight: minTouchSize + 8,
                          borderRadius: radius.control,
                          borderColor: active ? colors.link : colors.border,
                          backgroundColor: active || hovered ? colors.primaryTint : colors.surface,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[type.body, { color: colors.text }]}>{item.nombre}</Text>
                        <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
                          {TIPO[item.tipo]}, sede {item.sede}
                        </Text>
                      </View>
                      {active ? <Ionicons name="checkmark-circle" size={22} color={colors.link} /> : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  overlay: {
    flex: 1,
  },
  overlayCentro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayAbajo: {
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 16, 26, 0.5)',
  },
  panel: {
    overflow: 'hidden',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginTop: 8,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cerrar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estado: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
});
