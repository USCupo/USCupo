import { FontDisplay, useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AvisoCookies } from '../src/components/AvisoCookies';
import { FAMILIA_ICONOS } from '../src/components/Iconos';
import { AuthProvider } from '../src/lib/AuthContext';
import { useHidratado } from '../src/lib/useHidratado';
import { ThemeProvider } from '../src/theme/ThemeProvider';

// En web se pinta con la fuente del sistema y se cambia al cargar (swap); esperar las fuentes
// retrasaba el primer render varios segundos. En nativo se espera para evitar el salto.
const conSwap = (uri: number) => ({ uri, display: FontDisplay.SWAP });

// WOFF2 recortados a latín desde los TTF de @expo-google-fonts (~19 KB frente a ~340 KB):
// python -m fontTools.subset <ttf> --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD" \
//   --layout-features=kern,liga,calt,ccmp,locl,mark,mkmk --flavor=woff2 --output-file=assets/fonts/<nombre>.woff2
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold: conSwap(require('../assets/fonts/Poppins_600SemiBold.woff2')),
    Inter_400Regular: conSwap(require('../assets/fonts/Inter_400Regular.woff2')),
    Inter_700Bold: conSwap(require('../assets/fonts/Inter_700Bold.woff2')),
    // Íconos: block, para no mostrar cuadros de la fuente de reserva mientras carga (6 KB).
    [FAMILIA_ICONOS]: { uri: require('../assets/fonts/Iconos.woff2'), display: FontDisplay.BLOCK },
  });

  // Ya hidratado (y con el layout del ancho real): muestra la página desde tablet; ver app/+html.tsx.
  const hidratado = useHidratado();
  useEffect(() => {
    if (hidratado && typeof document !== 'undefined') document.documentElement.setAttribute('data-hidratado', '');
  }, [hidratado]);

  if (!fontsLoaded && Platform.OS !== 'web') return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <Slot />
          <AvisoCookies />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
