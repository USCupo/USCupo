import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useBreakpoint } from '../theme/useBreakpoint';
import { cristalClaro } from '../theme/glass';
import { useTheme } from '../theme/useTheme';
import { TextField } from './TextField';

export interface ItemLista {
  id: number;
  titulo: string;
  subtitulo?: string;
  seccion: string;
  /** Texto corto a la derecha (p. ej. "3 ofertas"). */
  nota?: string;
  deshabilitado?: boolean;
}

interface Props {
  label: string;
  placeholder: string;
  tituloModal: string;
  placeholderBusqueda: string;
  items: ItemLista[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  error?: string;
  /** Opción "todas" al inicio de la lista (selectedId === null). */
  opcionTodas?: string;
  onTodas?: () => void;
}

const sinAcentos = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Selector con búsqueda: hoja desde abajo en teléfono, diálogo centrado en pantallas grandes.
export function SelectorLista(p: Props) {
  const { colors, radius, spacing, type, minTouchSize } = useTheme();
  const { breakpoint, height } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const reducir = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const entrada = useRef(new Animated.Value(0)).current;
  const comoDialogo = breakpoint !== 'compacto';

  const seleccionado = p.items.find((i) => i.id === p.selectedId) ?? null;

  const secciones = useMemo(() => {
    const filtro = sinAcentos(q.trim());
    const mapa = new Map<string, ItemLista[]>();
    for (const it of p.items) {
      if (filtro && !sinAcentos(`${it.titulo} ${it.subtitulo ?? ''} ${it.seccion}`).includes(filtro)) continue;
      mapa.set(it.seccion, [...(mapa.get(it.seccion) ?? []), it]);
    }
    return Array.from(mapa, ([title, data]) => ({ title, data }));
  }, [p.items, q]);

  useEffect(() => {
    if (!open) return;
    entrada.setValue(reducir ? 1 : 0);
    if (!reducir) animarResorte(entrada, 1, resorte.suave).start();
  }, [open, reducir, entrada]);

  const cerrar = () => {
    setOpen(false);
    setQ('');
  };

  const anim = comoDialogo
    ? { opacity: entrada, transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }
    : { transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) }] };

  const textoBoton = seleccionado ? seleccionado.titulo : p.selectedId === null && p.opcionTodas ? p.opcionTodas : p.placeholder;

  return (
    <View style={{ marginBottom: spacing.md }}>
      {p.label ? (
        <Text style={[type.bodyMuted, { color: colors.text, fontFamily: 'Inter_700Bold', marginBottom: spacing.xs }]}>{p.label}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${p.label || p.tituloModal}: ${textoBoton}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            minHeight: minTouchSize + 4,
            borderRadius: radius.control,
            borderColor: p.error ? colors.danger : colors.border,
            backgroundColor: colors.surface,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={{ flex: 1, paddingVertical: spacing.sm }}>
          <Text numberOfLines={1} style={[type.body, { color: seleccionado || p.opcionTodas ? colors.text : colors.textMuted }]}>
            {textoBoton}
          </Text>
          {seleccionado?.subtitulo ? (
            <Text numberOfLines={1} style={[type.bodyMuted, { color: colors.textMuted }]}>
              {seleccionado.subtitulo}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {p.error ? (
        <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginTop: spacing.xs }]}>
          {p.error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={cerrar} statusBarTranslucent>
        <View style={[{ flex: 1 }, comoDialogo ? styles.centro : styles.abajo]}>
          <Pressable accessibilityLabel="Cerrar" onPress={cerrar} style={[StyleSheet.absoluteFill, styles.scrim]} />
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
              anim,
            ]}
          >
            {!comoDialogo && <View style={[styles.grabber, { backgroundColor: colors.border }]} />}
            <View style={[styles.cabecera, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
              <Text style={[type.sectionTitle, { color: colors.text, flex: 1 }]}>{p.tituloModal}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={cerrar}
                hitSlop={8}
                style={({ pressed }) => [styles.cerrar, { backgroundColor: colors.primaryTint, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="close" size={20} color={colors.link} />
              </Pressable>
            </View>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
              <TextField label="Buscar" placeholder={p.placeholderBusqueda} value={q} onChangeText={setQ} autoCorrect={false} autoFocus={comoDialogo} />
            </View>
            <SectionList
              sections={secciones}
              keyExtractor={(it) => String(it.id)}
              keyboardShouldPersistTaps="handled"
              stickySectionHeadersEnabled
              contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
              ListHeaderComponent={
                p.opcionTodas && !q ? (
                  <OpcionLista
                    titulo={p.opcionTodas}
                    activa={p.selectedId === null}
                    onPress={() => {
                      p.onTodas?.();
                      cerrar();
                    }}
                  />
                ) : null
              }
              ListEmptyComponent={
                <Text style={[type.body, { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }]}>
                  Nada coincide con “{q.trim()}”.
                </Text>
              }
              renderSectionHeader={({ section }) => (
                <Text
                  accessibilityRole="header"
                  style={[
                    type.bodyMuted,
                    { color: colors.textMuted, fontFamily: 'Inter_700Bold', backgroundColor: colors.surface, paddingTop: spacing.md, paddingBottom: spacing.sm },
                  ]}
                >
                  {section.title}
                </Text>
              )}
              renderItem={({ item }) => (
                <OpcionLista
                  titulo={item.titulo}
                  subtitulo={item.subtitulo}
                  nota={item.nota}
                  deshabilitada={item.deshabilitado}
                  activa={item.id === p.selectedId}
                  onPress={() => {
                    p.onSelect(item.id);
                    cerrar();
                  }}
                />
              )}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

export function OpcionLista(o: { titulo: string; subtitulo?: string; nota?: string; activa: boolean; deshabilitada?: boolean; onPress: () => void }) {
  const { colors, radius, type, minTouchSize } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: o.activa, disabled: o.deshabilitada }}
      disabled={o.deshabilitada}
      onPress={o.onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.opcion,
        {
          minHeight: minTouchSize + 8,
          borderRadius: radius.control,
          borderColor: o.activa ? colors.link : colors.border,
          backgroundColor: o.activa || hovered ? colors.primaryTint : colors.surface,
          opacity: o.deshabilitada ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: colors.text }]}>{o.titulo}</Text>
        {o.subtitulo ? <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{o.subtitulo}</Text> : null}
      </View>
      {o.nota ? <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{o.nota}</Text> : null}
      {o.activa ? <Ionicons name="checkmark-circle" size={22} color={colors.link} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, gap: 8 },
  centro: { alignItems: 'center', justifyContent: 'center' },
  abajo: { justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(3, 10, 24, 0.55)' },
  panel: {
    overflow: 'hidden',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginTop: 8 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cerrar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  opcion: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, gap: 8 },
});
