import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/lib/AuthContext';

export default function AuthLayout() {
  const { session } = useAuth();

  // Con sesión abierta (correo o Microsoft), el índice decide si falta completar el perfil.
  if (session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
