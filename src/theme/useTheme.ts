import { useThemeState } from './ThemeProvider';
import { spacing, radius, minTouchSize } from './spacing';
import { typeScale } from './typography';

export function useTheme() {
  const { colors, esquema } = useThemeState();
  return { colors, spacing, radius, minTouchSize, type: typeScale, scheme: esquema };
}
