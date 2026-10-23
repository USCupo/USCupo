import { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandPanel } from '../../src/components/BrandPanel';
import { Button } from '../../src/components/Button';
import { CarreraPicker } from '../../src/components/CarreraPicker';
import { GradientBackground } from '../../src/components/GradientBackground';
import { InfoNotice } from '../../src/components/InfoNotice';
import { Logo } from '../../src/components/Logo';
import { MicrosoftButton } from '../../src/components/MicrosoftButton';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { TextField } from '../../src/components/TextField';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { MIN_CONTRASENA } from '../../src/controllers/auth';
import { useLoginController, type LoginController } from '../../src/controllers/useLoginController';
import { USC_EMAIL_DOMAIN } from '../../src/lib/supabase';
import { animarResorte, resorte, useReducedMotion } from '../../src/theme/motion';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  // El controlador vive aquí y no dentro del formulario: si la ventana cruza un
  // breakpoint, el layout cambia pero lo escrito se conserva.
  const c = useLoginController();

  if (breakpoint === 'amplio') {
    return (
      <GradientBackground style={styles.split}>
        <View style={styles.splitMarca}>
          <BrandPanel />
        </View>
        <View style={styles.splitForm}>
          <View style={[styles.toggleFlotante, { top: spacing.lg, right: spacing.lg }]}>
            <ThemeToggle />
          </View>
          <ScrollView
            contentContainerStyle={[styles.centrado, { padding: spacing.xxl }]}
            keyboardShouldPersistTaps="handled"
          >
            <Tarjeta ancho={460}>
              <Formulario c={c} />
            </Tarjeta>
          </ScrollView>
        </View>
      </GradientBackground>
    );
  }

  const medio = breakpoint === 'medio';

  return (
    <GradientBackground>
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
                <Formulario c={c} />
              </Tarjeta>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function Tarjeta({ children, ancho }: { children: React.ReactNode; ancho?: number }) {
  const { colors, spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  return (
    <View
      style={[
        styles.tarjeta,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
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
      <Logo size={44} sobre="azul" />
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <Text style={[type.sectionTitle, { color: colors.onBackground }]}>
          USC<Text style={{ color: colors.accent }}>upo</Text>
        </Text>
        <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted }]}>Cambios de horario entre estudiantes USC</Text>
      </View>
      <ThemeToggle />
    </View>
  );
}

function Formulario({ c }: { c: LoginController }) {
  const { colors, spacing, type } = useTheme();
  const reducir = useReducedMotion();
  const registro = c.modo === 'registro';
  const ocupado = c.enviando || c.microsoftCargando;

  // Un solo momento de entrada: el formulario sube y aparece al cargar la pantalla.
  const entrada = useRef(new Animated.Value(reducir ? 1 : 0)).current;
  useEffect(() => {
    if (!reducir) animarResorte(entrada, 1, resorte.suave).start();
  }, [entrada, reducir]);

  return (
    <Animated.View
      style={{
        opacity: entrada,
        transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <SegmentedControl
        options={['Crear cuenta', 'Iniciar sesión']}
        selectedIndex={registro ? 0 : 1}
        onChange={(i) => c.setModo(i === 0 ? 'registro' : 'ingreso')}
      />

      <View style={{ marginTop: spacing.lg }}>
        <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}>
          {registro ? 'Crea tu cuenta' : 'Inicia sesión'}
        </Text>
        <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
          Solo estudiantes con correo institucional{' '}
          <Text style={{ color: colors.accentText, fontFamily: 'Inter_700Bold' }}>@{USC_EMAIL_DOMAIN}</Text>
        </Text>

        <MicrosoftButton onPress={c.entrarConMicrosoft} loading={c.microsoftCargando} disabled={c.enviando} />
        <Text style={[type.bodyMuted, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
          Con tu cuenta USC de Microsoft 365, sin crear contraseña
        </Text>

        <View style={[styles.divisor, { marginVertical: spacing.lg }]}>
          <View style={[styles.lineaDivisor, { backgroundColor: colors.border }]} />
          <Text style={[type.bodyMuted, { color: colors.textMuted, marginHorizontal: spacing.sm }]}>
            o con correo y contraseña
          </Text>
          <View style={[styles.lineaDivisor, { backgroundColor: colors.border }]} />
        </View>

        {registro && (
          <TextField
            label="Nombre completo"
            placeholder="Andrea Salazar"
            value={c.campos.nombreCompleto}
            onChangeText={(v) => {
              c.setNombreCompleto(v);
              c.limpiarError('nombre');
            }}
            onBlur={() => c.validarCampo('nombre')}
            error={c.errores.nombre}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            editable={!ocupado}
          />
        )}

        <TextField
          label="Correo institucional"
          placeholder={`tu.nombre@${USC_EMAIL_DOMAIN}`}
          value={c.campos.correo}
          onChangeText={(v) => {
            c.setCorreo(v);
            c.limpiarError('correo');
          }}
          onBlur={() => c.validarCampo('correo')}
          onSubmitEditing={registro ? undefined : c.enviar}
          error={c.errores.correo}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          editable={!ocupado}
        />

        {registro && (
          <CarreraPicker
            label="Carrera"
            carreras={c.carreras.lista}
            cargando={c.carreras.cargando}
            selectedId={c.campos.carrera?.id ?? null}
            onSelect={c.elegirCarrera}
            error={c.errores.carrera}
          />
        )}

        <TextField
          label="Contraseña"
          placeholder={registro ? `Mínimo ${MIN_CONTRASENA} caracteres` : 'Tu contraseña'}
          value={c.campos.contrasena}
          onChangeText={(v) => {
            c.setContrasena(v);
            c.limpiarError('contrasena');
          }}
          onBlur={() => registro && c.validarCampo('contrasena')}
          onSubmitEditing={c.enviar}
          error={c.errores.contrasena}
          password
          autoCapitalize="none"
          autoComplete={registro ? 'new-password' : 'current-password'}
          textContentType={registro ? 'newPassword' : 'password'}
          editable={!ocupado}
        />

        {c.carreras.origen === 'local' && registro && (
          <View style={{ marginBottom: spacing.md }}>
            <InfoNotice>
              Sin conexión con el servidor: puedes elegir tu carrera, pero la cuenta se crea cuando la conexión vuelva.
            </InfoNotice>
          </View>
        )}

        {c.errorFormulario ? (
          <Text
            role="alert"
            accessibilityLiveRegion="polite"
            style={[type.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}
          >
            {c.errorFormulario}
          </Text>
        ) : null}
        {c.avisoConfirmacion && (
          <View style={{ marginBottom: spacing.md }}>
            <InfoNotice>
              {`Cuenta creada. Abre el enlace que enviamos a ${c.avisoConfirmacion} para confirmarla y luego inicia sesión.`}
            </InfoNotice>
          </View>
        )}

        <Button
          label={registro ? 'Crear cuenta' : 'Iniciar sesión'}
          loadingLabel={registro ? 'Creando cuenta…' : 'Iniciando sesión…'}
          onPress={c.enviar}
          loading={c.enviando}
          disabled={c.microsoftCargando}
        />

        <Pressable
          accessibilityRole="button"
          onPress={c.alternarModo}
          disabled={ocupado}
          style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm }}
        >
          <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
            {registro ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <Text style={{ color: colors.link, fontFamily: 'Inter_700Bold' }}>
              {registro ? 'Inicia sesión' : 'Crear cuenta'}
            </Text>
          </Text>
        </Pressable>

        <View style={{ marginTop: spacing.md }}>
          <InfoNotice>
            USCupo solo conecta estudiantes. La gestión del cambio de horario se hace directamente en los canales
            oficiales de la USC.
          </InfoNotice>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineaDivisor: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  split: {
    flexDirection: 'row',
  },
  splitMarca: {
    flex: 1.1,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
});
