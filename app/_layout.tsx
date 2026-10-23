import { useFonts as usePoppins, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useFonts as useInter, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/lib/AuthContext';
import { ThemeProvider, useThemeState } from '../src/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedStatusBar() {
  const { esquema } = useThemeState();
  return <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [poppinsLoaded] = usePoppins({ Poppins_600SemiBold });
  const [interLoaded] = useInter({ Inter_400Regular, Inter_700Bold });
  const fontsLoaded = poppinsLoaded && interLoaded;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedStatusBar />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
