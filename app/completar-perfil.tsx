import { Redirect } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { CarreraPicker } from '../src/components/CarreraPicker';
import { GradientBackground } from '../src/components/GradientBackground';
import { Logo } from '../src/components/Logo';
import { TextField } from '../src/components/TextField';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { useCompletarPerfilController } from '../src/controllers/useCompletarPerfilController';
import { useAuth } from '../src/lib/AuthContext';
import { legalVigente, perfilCompleto } from '../src/models/perfiles';
import { useBreakpoint } from '../src/theme/useBreakpoint';
import { cristalClaro, glass } from '../src/theme/glass';
import { useTheme } from '../src/theme/useTheme';
import { FooterWeb } from '../src/components/FooterWeb';
import { MetaPagina, metadatos } from '../src/components/MetaPagina';
import { fonts } from '../src/theme/typography';

export const generateMetadata = () => metadatos({ titulo: 'Completa tu perfil' });

export default function CompletarPerfilScreen() {
  const { session, perfil, loading } = useAuth();
  if (!loading && (!session || !legalVigente(perfil) || perfilCompleto(perfil))) return <Redirect href="/" />;
  if (loading) return null;
  return <Contenido />;
}

function Contenido() {
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const c = useCompletarPerfilController();
  const tarjeta = breakpoint !== 'compacto';

  return (
    <GradientBackground>
      <MetaPagina titulo="Completa tu perfil" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            tarjeta && styles.centrado,
            {
              padding: tarjeta ? spacing.xl : spacing.lg,
              paddingTop: insets.top + (tarjeta ? spacing.xl : spacing.lg),
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={tarjeta ? { width: '100%', maxWidth: 480 } : undefined}>
            <View style={styles.header}>
              <Logo size={44} sobre="azul" />
              <Text style={[type.sectionTitle, { color: colors.onBackground, marginLeft: spacing.sm, flex: 1 }]}>
                USC<Text style={{ color: colors.accent }}>upo</Text>
              </Text>
              <ThemeToggle />
            </View>

            <View
              style={[
                styles.tarjeta,
                cristalClaro(colors),
                {
                  marginTop: spacing.lg,
                  padding: tarjeta ? spacing.xl : spacing.lg,
                },
              ]}
            >
              <Text
                accessibilityRole="header"
                style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}
              >
                Completa tu perfil
              </Text>
              <Text
                style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}
              >
                Entraste como {c.correo}. Falta tu carrera para mostrarte los cambios de tus materias.
              </Text>

              <TextField
                label="Nombre completo"
                placeholder="Andrea Salazar"
                value={c.nombreCompleto}
                onChangeText={c.setNombreCompleto}
                error={c.errores.nombre}
                autoCapitalize="words"
                autoComplete="name"
              />

              <CarreraPicker
                label="Carrera"
                carreras={c.carreras.lista}
                cargando={c.carreras.cargando}
                selectedId={c.carrera?.id ?? null}
                onSelect={c.elegirCarrera}
                error={c.errores.carrera}
              />

              {c.errorFormulario ? (
                <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>
                  {c.errorFormulario}
                </Text>
              ) : null}

              <Button label="Guardar y continuar" loadingLabel="Guardando…" onPress={c.guardar} loading={c.guardando} />

              <Pressable
                accessibilityRole="button"
                onPress={c.salir}
                style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm }}
              >
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
                  ¿No es tu cuenta?{' '}
                  <Text style={{ color: colors.link, fontFamily: fonts.bodyBold }}>Cerrar sesión</Text>
                </Text>
              </Pressable>
            </View>
            <FooterWeb style={{ marginTop: spacing.xl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centrado: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjeta: {
    borderRadius: glass.panel,
  },
});
