import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../lib/AuthContext';
import { cristalClaro, cristalOscuro, glass } from '../theme/glass';
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

// Navbar flotante de cristal: píldora superior en computador, dock inferior en teléfono y
// tablet. Flota sobre el contenido (posición absoluta); Pantalla reserva su espacio.
export function BarraNavegacion({ state, navigation, pendientes = 0 }: Props) {
  const { breakpoint } = useBreakpoint();
  const rutas = state.routes.filter((r) => ITEMS[r.name]);

  const ir = (route: { key: string; name: string }, activa: boolean) => {
    const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!activa && !evento.defaultPrevented) navigation.navigate(route.name);
  };

  const props = { rutas, activa: state.routes[state.index]?.name, ir, pendientes };
  if (breakpoint === 'amplio') return <Superior {...props} />;
  return <Inferior {...props} />;
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

function Superior({ rutas, activa, ir, pendientes }: VistaProps) {
  const { colors, type } = useTheme();
  const { perfil } = useAuth();
  const insets = useSafeAreaInsets();
  const perfilRuta = rutas.find((r) => r.name === 'perfil');
  const inicial = (perfil?.nombre_completo ?? 'E').trim().charAt(0).toUpperCase();

  return (
    <View pointerEvents="box-none" style={[styles.capaSuperior, { paddingTop: insets.top + glass.margen }]}>
      <View style={[styles.pildora, cristalOscuro(colors)]}>
        <View style={styles.marca}>
          <Logo size={32} sobre="azul" />
          <Text style={[type.sectionTitle, { color: colors.onBackground, fontSize: 19 }]}>
            USC<Text style={{ color: colors.accent }}>upo</Text>
          </Text>
        </View>

        <View accessibilityRole="tablist" style={styles.enlaces}>
          {/* Perfil no va aquí: en computador se llega por el avatar con la inicial. */}
          {rutas.filter((r) => r.name !== 'perfil').map((r) => {
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
                  styles.enlace,
                  {
                    backgroundColor: sel ? 'rgba(255,255,255,0.12)' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderColor: sel ? colors.onBackgroundBorder : 'transparent',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name={sel ? item.iconoActivo : item.icono} size={18} color={sel ? colors.accent : colors.onBackgroundMuted} />
                <Text style={[type.bodyMuted, { color: sel ? colors.onBackground : colors.onBackgroundMuted, fontFamily: sel ? 'Inter_700Bold' : 'Inter_400Regular' }]}>
                  {item.label}
                </Text>
                {r.name === 'mis-cambios' ? <Contador n={pendientes} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.extremo}>
          <ThemeToggle />
          {perfilRuta ? (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: activa === 'perfil' }}
              accessibilityLabel={`Perfil de ${perfil?.nombre_completo ?? 'estudiante'}`}
              onPress={() => ir(perfilRuta, activa === 'perfil')}
              style={({ hovered }: { hovered?: boolean; pressed: boolean }) => [
                styles.avatar,
                {
                  backgroundColor: colors.accent,
                  opacity: hovered ? 0.88 : 1,
                  // Aro de "pestaña activa" ahora que Perfil no tiene enlace propio.
                  borderColor: activa === 'perfil' ? colors.onBackground : 'transparent',
                },
              ]}
            >
              <Text style={{ color: '#0A2959', fontFamily: 'Inter_700Bold', fontSize: 15 }}>{inicial}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function Inferior({ rutas, activa, ir, pendientes }: VistaProps) {
  const { colors, type } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.capaInferior, { paddingBottom: Math.max(insets.bottom, glass.margen) }]}>
      <View accessibilityRole="tablist" style={[styles.dock, cristalClaro(colors)]}>
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
                <View style={[styles.icono, { backgroundColor: sel ? colors.primaryTint : 'transparent' }]}>
                  <Ionicons name={sel ? item.iconoActivo : item.icono} size={22} color={sel ? colors.link : colors.textMuted} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  capaSuperior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  pildora: {
    width: '100%',
    maxWidth: 1144,
    minHeight: glass.altoBarraSuperior,
    borderRadius: glass.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 20,
    paddingRight: 10,
    gap: 16,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enlaces: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  enlace: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: glass.pill,
    borderWidth: 1,
  },
  extremo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capaInferior: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: glass.margen,
  },
  dock: {
    width: '100%',
    maxWidth: 520,
    minHeight: glass.altoBarraInferior,
    borderRadius: glass.pill,
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  itemInferior: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  icono: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    right: -6,
  },
});
