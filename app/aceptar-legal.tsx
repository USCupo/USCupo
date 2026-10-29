import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { CasillaLegal } from '../src/components/CasillaLegal';
import { GradientBackground } from '../src/components/GradientBackground';
import { InfoNotice } from '../src/components/InfoNotice';
import { Logo } from '../src/components/Logo';
import { cerrarSesion, mensajeDeError } from '../src/controllers/auth';
import { useAuth } from '../src/lib/AuthContext';
import { AVISO_NO_OFICIAL, ERROR_SIN_ACEPTAR } from '../src/models/legal';
import { aceptarLegal, legalVigente } from '../src/models/perfiles';
import { useBreakpoint } from '../src/theme/useBreakpoint';
import { cristalClaro, glass } from '../src/theme/glass';
import { useTheme } from '../src/theme/useTheme';
import { FooterWeb } from '../src/components/FooterWeb';
import { MetaPagina, metadatos } from '../src/components/MetaPagina';

// Cuentas que aún no aceptan la versión vigente (Microsoft, anteriores a la casilla o texto nuevo).

export const generateMetadata = () => metadatos({ titulo: 'Acepta los términos' });

export default function AceptarLegalScreen() {
  const { session, perfil, loading } = useAuth();
  if (!loading && (!session || legalVigente(perfil))) return <Redirect href="/" />;
  return (
    <>
      <MetaPagina titulo="Acepta los términos" />
      {loading ? null : <Contenido />}
    </>
  );
}

function Contenido() {
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const { recargarPerfil } = useAuth();
  const [aceptado, setAceptado] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const tarjeta = breakpoint !== 'compacto';

  const continuar = useCallback(async () => {
    if (enviando) return;
    if (!aceptado) {
      setError(ERROR_SIN_ACEPTAR);
      return;
    }
    setEnviando(true);
    setError(undefined);
    try {
      await aceptarLegal();
      // Con el perfil nuevo el índice decide si falta completar el perfil o va a las pestañas.
      await recargarPerfil();
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }, [aceptado, enviando, recargarPerfil]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={[
          tarjeta && styles.centrado,
          {
            padding: tarjeta ? spacing.xl : spacing.lg,
            paddingTop: insets.top + (tarjeta ? spacing.xl : spacing.lg),
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <View style={tarjeta ? { width: '100%', maxWidth: 480 } : undefined}>
          <View style={styles.header}>
            <Logo size={44} sobre="azul" />
            <Text style={[type.sectionTitle, { color: colors.onBackground, marginLeft: spacing.sm, flex: 1 }]}>
              USC<Text style={{ color: colors.accent }}>upo</Text>
            </Text>
          </View>

          <View
            style={[
              styles.tarjeta,
              cristalClaro(colors),
              { marginTop: spacing.lg, padding: tarjeta ? spacing.xl : spacing.lg },
            ]}
          >
            <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}>
              Antes de continuar
            </Text>
            <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md }]}>
              Para mostrar tus ofertas y compartir tu contacto cuando haya un cambio, USCupo trata tu nombre, correo
              institucional, carrera y, si lo agregas, tu WhatsApp. Léelos y acéptalos para seguir.
            </Text>

            <CasillaLegal
              aceptado={aceptado}
              onCambiar={(v) => {
                setAceptado(v);
                setError(undefined);
              }}
              error={error}
              disabled={enviando}
            />

            <Button label="Aceptar y continuar" loadingLabel="Guardando…" onPress={continuar} loading={enviando} />
            <View style={{ marginTop: spacing.sm }}>
              <Button label="No acepto, cerrar sesión" variant="ghost" onPress={cerrarSesion} disabled={enviando} />
            </View>
            <View style={{ marginTop: spacing.md }}>
              <InfoNotice>{AVISO_NO_OFICIAL}</InfoNotice>
            </View>
          </View>
          <FooterWeb style={{ marginTop: spacing.xl }} />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  centrado: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  tarjeta: { borderRadius: glass.panel },
});
