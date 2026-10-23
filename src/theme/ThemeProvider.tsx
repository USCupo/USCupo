import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { guardarPreferenciaTema, leerPreferenciaTema, type PreferenciaTema } from '../models/preferencias';
import { darkColors, lightColors, type ThemeColors } from './colors';

type Esquema = 'light' | 'dark';

interface ThemeState {
  esquema: Esquema;
  colors: ThemeColors;
  preferencia: PreferenciaTema;
  setPreferencia: (preferencia: PreferenciaTema) => void;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferenciaState] = useState<PreferenciaTema>('sistema');

  useEffect(() => {
    leerPreferenciaTema().then(setPreferenciaState);
  }, []);

  const esquema: Esquema =
    preferencia === 'sistema' ? (sistema === 'dark' ? 'dark' : 'light') : preferencia === 'oscuro' ? 'dark' : 'light';
  const colors = esquema === 'dark' ? darkColors : lightColors;

  const setPreferencia = useCallback((nueva: PreferenciaTema) => {
    setPreferenciaState(nueva);
    guardarPreferenciaTema(nueva);
  }, []);

  const alternarTema = useCallback(() => {
    setPreferencia(esquema === 'dark' ? 'claro' : 'oscuro');
  }, [esquema, setPreferencia]);

  useEffect(() => {
    if (Platform.OS === 'web') aplicarTemaWeb(esquema, colors.background);
  }, [esquema, colors.background]);

  const value = useMemo(
    () => ({ esquema, colors, preferencia, setPreferencia, alternarTema }),
    [esquema, colors, preferencia, setPreferencia, alternarTema]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeState(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeState debe usarse dentro de <ThemeProvider>');
  return ctx;
}

// En web, el cambio de tema se funde en lugar de saltar: transición de color global,
// desactivada si el usuario pide menos movimiento.
const ESTILO_WEB_ID = 'uscupo-theme-transition';

function aplicarTemaWeb(esquema: Esquema, fondo: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.colorScheme = esquema;
  root.style.backgroundColor = fondo;
  document.body.style.backgroundColor = fondo;

  if (!document.getElementById(ESTILO_WEB_ID)) {
    const style = document.createElement('style');
    style.id = ESTILO_WEB_ID;
    style.textContent = `
      @media (prefers-reduced-motion: no-preference) {
        html, body, #root, #root * {
          transition-property: background-color, border-color, color, fill;
          transition-duration: 320ms;
          transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
