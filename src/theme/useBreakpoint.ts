import { useWindowDimensions } from 'react-native';
import { useHidratado } from '../lib/useHidratado';

// compacto: teléfono · medio: tablet / ventana angosta · amplio: computador.
export type Breakpoint = 'compacto' | 'medio' | 'amplio';

export function useBreakpoint(): { breakpoint: Breakpoint; width: number; height: number } {
  const ventana = useWindowDimensions();
  // El build no tiene ventana (ancho 0, compacto); el navegador usa la suya tras hidratar.
  const { width, height } = useHidratado() ? ventana : { width: 0, height: 0 };
  const breakpoint: Breakpoint = width >= 1024 ? 'amplio' : width >= 640 ? 'medio' : 'compacto';
  return { breakpoint, width, height };
}
