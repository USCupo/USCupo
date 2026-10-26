import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { conAlfa, cristalClaro, glass } from '../theme/glass';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { BrandPanel } from './BrandPanel';
import { FooterWeb } from './FooterWeb';
import { GradientBackground } from './GradientBackground';
import Ionicons from './Iconos';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

// Marco de las pantallas de acceso (ingresar, recuperar y restablecer la contraseña): en computador
// la marca a la izquierda y la tarjeta de cristal a la derecha; en teléfono y tablet, logo arriba y
// tarjeta debajo. Quien lo usa pone el contenido de la tarjeta; el estado vive fuera del marco, así
// que cruzar un breakpoint no borra lo escrito.
export function MarcoAcceso({ meta, children }: { meta: ReactNode; children: ReactNode }) {
  const { colors, spacing } = useTheme();
  const { breakpoint, height } = useBreakpoint();
  const insets = useSafeAreaInsets();

  if (breakpoint === 'amplio') {
    return (
      <GradientBackground>
        {meta}
        {/* Un solo scroll para toda la página: el split llena al menos la ventana y el pie va al
            final, en el flujo; en portátiles bajos nada se monta sobre nada. */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.split}>
            <View style={styles.splitMarca}>
              {/* Sticky y con el alto de la ventana: el panel queda centrado en pantalla mientras se
                  baja por el formulario; si no cabe, crece en vez de montarse. */}
              <View style={[styles.marcaFija, { minHeight: height }]}>
                <BrandPanel bajo={height < 760} />
              </View>
            </View>
            <View style={[styles.splitForm, styles.centrado, { padding: spacing.xxl }]}>
              <Tarjeta ancho={460}>
                {children}
              </Tarjeta>
            </View>
            <View style={[styles.toggleFlotante, { top: spacing.lg, right: spacing.lg }]}>
              <ThemeToggle />
            </View>
          </View>
          <FooterWeb conContacto={false} style={{ width: 'auto', marginHorizontal: spacing.lg, marginBottom: spacing.lg }} />
        </ScrollView>
      </GradientBackground>
    );
  }

  const medio = breakpoint === 'medio';

  return (
    <GradientBackground>
      {meta}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            medio && styles.centrado,
            {
              padding: medio ? spacing.xl : spacing.md,
              paddingTop: insets.top + (medio ? spacing.xl : spacing.lg),
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={medio ? { width: '100%', maxWidth: 480 } : undefined}>
            <View style={{ paddingHorizontal: medio ? 0 : spacing.sm }}>
              <Encabezado />
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <Tarjeta>
                {children}
              </Tarjeta>
            </View>
            <FooterWeb conContacto={false} style={{ marginTop: spacing.xl }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function Tarjeta({ children, ancho }: { children: ReactNode; ancho?: number }) {
  const { colors, spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  return (
    <View
      style={[
        styles.tarjeta,
        cristalClaro(colors),
        {
          padding: breakpoint === 'compacto' ? spacing.lg : spacing.xl,
        },
        ancho ? { width: '100%', maxWidth: ancho } : null,
      ]}
    >
      {children}
    </View>
  );
}

function Encabezado() {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.toggleEncabezado}>
        <ThemeToggle />
      </View>
      {/* Logo centrado, más grande y justo encima del eslogan. */}
      <Logo size={72} sobre="azul" />
      {/* H1 de la pantalla en teléfono y tablet; en computador lo es el lema del BrandPanel. */}
      <Text role="heading" aria-level={1} style={[type.sectionTitle, { color: colors.onBackground, marginTop: spacing.sm, textAlign: 'center' }]}>
        USC<Text style={{ color: colors.accent }}>upo</Text>
      </Text>
      <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, textAlign: 'center' }]}>
        Cambios de horario entre estudiantes USC
      </Text>
    </View>
  );
}

/** Insignia redonda sobre el título de un paso (correo enviado, enlace válido, listo, error). */
export function IconoAcceso({ nombre, tono = 'acento' }: { nombre: 'mail-outline' | 'shield-checkmark-outline' | 'checkmark-circle' | 'alert'; tono?: 'acento' | 'peligro' }) {
  const { colors, spacing } = useTheme();
  const color = tono === 'peligro' ? colors.danger : colors.accentText;
  return (
    <View
      style={[styles.insignia, { backgroundColor: tono === 'peligro' ? conAlfa(colors.danger, 0.12) : colors.accentTint, marginBottom: spacing.md }]}
      aria-hidden
    >
      <Ionicons name={nombre} size={26} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  insignia: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  toggleEncabezado: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  splitMarca: {
    flex: 1.1,
  },
  marcaFija: {
    position: 'sticky' as 'relative',
    top: 0,
  },
  splitForm: {
    flex: 1,
  },
  toggleFlotante: {
    position: 'absolute',
    zIndex: 10,
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
