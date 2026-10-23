import { useWindowDimensions } from 'react-native';

// compacto: teléfono · medio: tablet / ventana angosta · amplio: computador.
export type Breakpoint = 'compacto' | 'medio' | 'amplio';

export function useBreakpoint(): { breakpoint: Breakpoint; width: number; height: number } {
  const { width, height } = useWindowDimensions();
  const breakpoint: Breakpoint = width >= 1024 ? 'amplio' : width >= 640 ? 'medio' : 'compacto';
  return { breakpoint, width, height };
}
