import { useFonts as usePoppins, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useFonts as useInter, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AvisoCookies } from '../src/components/AvisoCookies';
import { AuthProvider } from '../src/lib/AuthContext';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  const [poppinsLoaded] = usePoppins({ Poppins_600SemiBold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_700Bold });
  const fontsLoaded = poppinsLoaded && interLoaded;

  if (!fontsLoaded) return null;

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
