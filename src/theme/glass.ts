import type { ViewStyle } from 'react-native';
import type { ThemeColors } from './colors';

// Material "cristal" (inspirado en alburastudio.com): superficies flotantes, translúcidas y
// redondeadas que dejan ver el degradado institucional detrás. No introduce colores nuevos:
// toma los de la paleta USC y les baja la opacidad.

export const glass = {
  /** Píldora: navbar, botones de navegación, selectores. */
  pill: 999,
  /** Paneles flotantes (barra inferior, menús). */
  panel: 28,
  blur: 14,
  /** Separación de la barra flotante respecto al borde de la ventana. */
  margen: 12,
  /** Alto útil de la barra flotante, para reservar espacio en el contenido. */
  altoBarraSuperior: 64,
  altoBarraInferior: 64,
} as const;

/** '#0A2959' + 0.72 → 'rgba(10,41,89,0.72)'. */
export function conAlfa(hex: string, alfa: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}

/** Cristal oscuro sobre el degradado azul (navbar de escritorio). */
export function cristalOscuro(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: conAlfa(colors.backgroundEnd, 0.72),
    borderColor: colors.onBackgroundBorder,
    borderWidth: 1,
    ...sombraYDesenfoque(),
  };
}

/** Cristal claro: la superficie de tarjeta translúcida (barra inferior en teléfono). */
export function cristalClaro(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: conAlfa(colors.surface, 0.8),
    borderColor: conAlfa(colors.border, 0.9),
    borderWidth: 1,
    ...sombraYDesenfoque(),
  };
}

/** Cristal de botón: el color de relleno (primario, tinte…) translúcido, mismo borde y sombra. */
export function cristalBoton(fondo: string, borde = 'rgba(255,255,255,0.18)'): ViewStyle {
  return {
    backgroundColor: conAlfa(fondo, 0.85),
    borderColor: borde,
    borderWidth: 1,
    ...sombraYDesenfoque(),
  };
}

function sombraYDesenfoque(): ViewStyle {
  return {
    boxShadow: '0px 18px 40px -24px rgba(0,0,0,0.8)',
    // backdropFilter no está en los tipos de React Native, pero react-native-web lo pasa al CSS.
    ...({ backdropFilter: `blur(${glass.blur}px) saturate(140%)` } as ViewStyle),
  };
}
