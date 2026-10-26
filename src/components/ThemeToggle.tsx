import Ionicons from './Iconos';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useThemeState } from '../theme/ThemeProvider';
import { usc } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

const ANCHO = 64;
const ALTO = 34;
const PERILLA = 26;
const RECORRIDO = ANCHO - PERILLA - (ALTO - PERILLA);

// Interruptor claro/oscuro sobre el fondo azul: la perilla viaja con un resorte y el ícono
// gira al llegar, como un sol que se pone y una luna que sale. Acentos en amarillo USC.
export function ThemeToggle() {
  const { alternarTema, esquema } = useThemeState();
  const { colors } = useTheme();
  const reducir = useReducedMotion();
  const oscuro = esquema === 'dark';
  const pos = useRef(new Animated.Value(oscuro ? 1 : 0)).current;
  const presion = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducir) pos.setValue(oscuro ? 1 : 0);
    else animarResorte(pos, oscuro ? 1 : 0, resorte.vivo).start();
  }, [oscuro, reducir, pos]);

  const translateX = pos.interpolate({ inputRange: [0, 1], outputRange: [0, RECORRIDO] });
  const rotate = pos.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const solOpacity = pos.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const lunaOpacity = pos.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel="Tema oscuro"
      aria-checked={oscuro}
      onPress={alternarTema}
      onPressIn={() => !reducir && animarResorte(presion, 0.92, resorte.suave).start()}
      onPressOut={() => !reducir && animarResorte(presion, 1, resorte.suave).start()}
      hitSlop={6}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: colors.onBackgroundBorder },
        ]}
      >
        <Ionicons name="sunny-outline" size={14} color={colors.onBackgroundMuted} style={styles.iconoIzq} />
        <Ionicons name="moon-outline" size={13} color={colors.onBackgroundMuted} style={styles.iconoDer} />
        <Animated.View
          style={[
            styles.perilla,
            {
              backgroundColor: oscuro ? usc.azulNativo : usc.blanco,
              transform: [{ translateX }, { scale: presion }],
            },
          ]}
        >
          <Animated.View style={[styles.capa, { opacity: solOpacity, transform: [{ rotate }] }]}>
            <Ionicons name="sunny" size={16} color={usc.amarilloOscuro} />
          </Animated.View>
          <Animated.View style={[styles.capa, { opacity: lunaOpacity, transform: [{ rotate }] }]}>
            <Ionicons name="moon" size={14} color={usc.amarillo} />
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: ANCHO,
    height: ALTO,
    borderRadius: ALTO / 2,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: (ALTO - PERILLA) / 2 - 1,
  },
  iconoIzq: { position: 'absolute', left: 10 },
  iconoDer: { position: 'absolute', right: 10 },
  perilla: {
    width: PERILLA,
    height: PERILLA,
    borderRadius: PERILLA / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  capa: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
