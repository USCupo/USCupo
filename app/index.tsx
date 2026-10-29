import { Redirect } from 'expo-router';
import { MetaPagina, metadatos } from '../src/components/MetaPagina';
import { PortadaPublica } from '../src/components/PortadaPublica';
import { useAuth } from '../src/lib/AuthContext';
import { perfilCompleto, legalVigente } from '../src/models/perfiles';

// Punto de entrada. Sin sesión (y mientras se averigua, que es lo que trae el HTML del build para
// buscadores, agentes y la revisión de AdSense) muestra la portada pública con qué es USCupo; con
// sesión lleva a donde corresponda.

export const generateMetadata = () => metadatos({
    titulo: 'Cambios de horario entre estudiantes USC',
    ruta: '/',
    descripcion:
      'Encuentra a alguien que quiera tu horario y te dé el suyo. Bolsa de intercambio de cupos entre estudiantes de la Universidad Santiago de Cali, solo con correo @usc.edu.co. Proyecto independiente, no oficial.',
  });

export default function Index() {
  const { session, perfil, loading } = useAuth();

  if (loading || !session) {
    return (
      <>
        <MetaPagina
          titulo="Cambios de horario entre estudiantes USC"
          ruta="/"
          descripcion="Encuentra a alguien que quiera tu horario y te dé el suyo. Bolsa de intercambio de cupos entre estudiantes de la Universidad Santiago de Cali, solo con correo @usc.edu.co. Proyecto independiente, no oficial."
        />
        <PortadaPublica />
      </>
    );
  }

  if (!legalVigente(perfil)) return <Redirect href="/aceptar-legal" />;
  if (!perfilCompleto(perfil)) return <Redirect href="/completar-perfil" />;
  return <Redirect href="/(tabs)" />;
}
