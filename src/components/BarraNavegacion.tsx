import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ITEMS: Record<string, { label: string; icono: IconName; iconoActivo: IconName }> = {
  index: { label: 'Inicio', icono: 'home-outline', iconoActivo: 'home' },
  buscar: { label: 'Buscar', icono: 'search-outline', iconoActivo: 'search' },
  publicar: { label: 'Publicar', icono: 'add-circle-outline', iconoActivo: 'add-circle' },
  'mis-cambios': { label: 'Mis cambios', icono: 'swap-horizontal-outline', iconoActivo: 'swap-horizontal' },
  perfil: { label: 'Perfil', icono: 'person-outline', iconoActivo: 'person' },
};

interface Props {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: { navigate: (name: string) => void; emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean } };
  pendientes?: number;
}

export function BarraNavegacion({ state, navigation, pendientes = 0 }: Props) {
  const { breakpoint } = useBreakpoint();
  const rutas = state.routes.filter((r) => ITEMS[r.name]);

  const ir = (route: { key: string; name: string }, activa: boolean) => {
    const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!activa && !evento.defaultPrevented) navigation.navigate(route.name);
  };

  if (breakpoint === 'amplio') return <Lateral rutas={rutas} activa={state.routes[state.index]?.name} ir={ir} pendientes={pendientes} />;
  return <Inferior rutas={rutas} activa={state.routes[state.index]?.name} ir={ir} pendientes={pendientes} />;
}

interface VistaProps {
  rutas: { key: string; name: string }[];
  activa?: string;
  ir: (route: { key: string; name: string }, activa: boolean) => void;
  pendientes: number;
}

function Contador({ n }: { n: number }) {
  const { colors } = useTheme();
  if (n <= 0) return null;
  return (
    <View style={[styles.contador, { backgroundColor: colors.accent }]} accessibilityLabel={`${n} pendientes`}>
      <Text style={{ color: '#0A2959', fontFamily: 'Inter_700Bold', fontSize: 11 }}>{n > 9 ? '9+' : n}</Text>
    </View>
  );
}

function Lateral({ rutas, activa, ir, pendientes }: VistaProps) {
  const { colors, spacing, type, radius } = useTheme();
  const { perfil, session } = useAuth();

  return (
    <View style={[styles.lateral, { backgroundColor: colors.backgroundEnd, borderRightColor: colors.onBackgroundBorder, padding: spacing.lg }]}>
      <View style={[styles.marca, { marginBottom: spacing.xl }]}>
        <Logo size={40} sobre="azul" />
        <Text style={[type.sectionTitle, { color: colors.onBackground }]}>
          USC<Text style={{ color: colors.accent }}>upo</Text>
        </Text>
      </View>

      <View accessibilityRole="tablist" style={{ gap: 4 }}>
        {rutas.map((r) => {
          const item = ITEMS[r.name];
          const sel = r.name === activa;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={item.label}
              onPress={() => ir(r, sel)}
              style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [
                styles.itemLateral,
                {
                  borderRadius: radius.control,
                  backgroundColor: sel ? 'rgba(255,255,255,0.12)' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.indicador, { backgroundColor: sel ? colors.accent : 'transparent' }]} />
              <Ionicons name={sel ? item.iconoActivo : item.icono} size={21} color={sel ? colors.accent : colors.onBackgroundMuted} />
              <Text style={[type.body, { color: sel ? colors.onBackground : colors.onBackgroundMuted, fontFamily: sel ? 'Inter_700Bold' : 'Inter_400Regular', flex: 1 }]}>
                {item.label}
              </Text>
              {r.name === 'mis-cambios' ? <Contador n={pendientes} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.usuario, { borderTopColor: colors.onBackgroundBorder, paddingTop: spacing.md }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[type.body, { color: colors.onBackground, fontFamily: 'Inter_700Bold' }]}>
            {perfil?.nombre_completo ?? 'Estudiante'}
          </Text>
          <Text numberOfLines={1} style={[type.bodyMuted, { color: colors.onBackgroundMuted }]}>
            {session?.user.email}
          </Text>
        </View>
        <ThemeToggle />
      </View>
    </View>
  );
}

function Inferior({ rutas, activa, ir, pendientes }: VistaProps) {
  const { colors, type } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.inferior, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      {rutas.map((r) => {
        const item = ITEMS[r.name];
        const sel = r.name === activa;
        const publicar = r.name === 'publicar';
        return (
          <Pressable
            key={r.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            accessibilityLabel={item.label}
            onPress={() => ir(r, sel)}
            style={({ pressed }) => [styles.itemInferior, { opacity: pressed ? 0.7 : 1 }]}
          >
            {publicar ? (
              <View style={[styles.publicar, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={26} color={colors.onPrimary} />
              </View>
            ) : (
              <View>
                <Ionicons name={sel ? item.iconoActivo : item.icono} size={23} color={sel ? colors.link : colors.textMuted} />
                {r.name === 'mis-cambios' ? (
                  <View style={styles.contadorFlotante}>
                    <Contador n={pendientes} />
                  </View>
                ) : null}
              </View>
            )}
            <Text
              numberOfLines={1}
              style={[type.bodyMuted, { fontSize: 11, lineHeight: 14, marginTop: 2, color: sel ? colors.link : colors.textMuted, fontFamily: sel ? 'Inter_700Bold' : 'Inter_400Regular' }]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lateral: {
    width: 264,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemLateral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  indicador: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
  },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inferior: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  itemInferior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 50,
  },
  publicar: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorFlotante: {
    position: 'absolute',
    top: -4,
    right: -12,
  },
});
