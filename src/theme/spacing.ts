import { glass } from './glass';

// Base de 8 pt (design system del mockup).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

// Mismo redondeado que la navbar de cristal: controles en píldora, tarjetas con card + 4 = glass.panel.
export const radius = {
  control: glass.pill,
  card: glass.panel - 4,
} as const;

export const minTouchSize = 44;
