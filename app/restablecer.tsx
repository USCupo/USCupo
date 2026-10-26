import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '../src/components/Button';
import { IconoAcceso, MarcoAcceso } from '../src/components/MarcoAcceso';
import { MetaPagina } from '../src/components/MetaPagina';
import { TextField } from '../src/components/TextField';
import { MIN_CONTRASENA } from '../src/controllers/auth';
import { useRestablecerController, type ParamsEnlace, type RestablecerController } from '../src/controllers/useRestablecerController';
import { useTheme } from '../src/theme/useTheme';

// react-native-web pasa dataSet como atributos data-*; los tipos de React Native no lo declaran.
const ENTRADA = { dataSet: { entrada: '' } } as object;

// Destino del enlace de "¿Olvidaste tu contraseña?". Fuera del grupo (auth): al canjear el enlace
// ya hay sesión y ese grupo redirigiría al inicio antes de elegir la contraseña.
export default function RestablecerScreen() {
  const params = useLocalSearchParams<ParamsEnlace & Record<string, string>>();
  const c = useRestablecerController(params);
  return (
    <MarcoAcceso meta={<MetaPagina titulo="Nueva contraseña" />}>
      {c.fase === 'verificando' ? (
        <Verificando />
      ) : (
        <View {...ENTRADA} key={c.fase}>
          {c.fase === 'formulario' ? <Formulario c={c} /> : c.fase === 'hecho' ? <Hecho /> : <Invalido motivo={c.motivo} />}
        </View>
      )}
    </MarcoAcceso>
  );
}

function Titulo({ children }: { children: string }) {
  const { colors, type } = useTheme();
  return (
    <Text role="heading" aria-level={2} style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}>
      {children}
    </Text>
  );
}

function Verificando() {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xl }} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} accessibilityLabel="Verificando el enlace" />
      <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.sm }]}>Verificando el enlace…</Text>
    </View>
  );
}

function Formulario({ c }: { c: RestablecerController }) {
  const { colors, spacing, type } = useTheme();
  return (
    <>
      <IconoAcceso nombre="shield-checkmark-outline" />
      <Titulo>Crea una contraseña nueva</Titulo>
      <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Al guardarla cerramos tu sesión en los demás equipos.
      </Text>

      <TextField
        label="Contraseña nueva"
        placeholder={`Mínimo ${MIN_CONTRASENA} caracteres`}
        value={c.campos.nueva}
        onChangeText={c.cambiarNueva}
        onBlur={c.validarNueva}
        error={c.errores.nueva}
        password
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!c.guardando}
      />
      <TextField
        label="Confirma la contraseña"
        placeholder="Escríbela de nuevo"
        value={c.campos.confirmacion}
        onChangeText={c.cambiarConfirmacion}
        onSubmitEditing={c.guardar}
        error={c.errores.confirmacion}
        password
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        editable={!c.guardando}
      />

      {c.errorFormulario ? (
        <Text role="alert" accessibilityLiveRegion="polite" style={[type.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>
          {c.errorFormulario}
        </Text>
      ) : null}

      <Button label="Guardar contraseña" loadingLabel="Guardando…" onPress={c.guardar} loading={c.guardando} />
    </>
  );
}

function Hecho() {
  const { colors, spacing, type } = useTheme();
  const router = useRouter();
  return (
    <>
      <IconoAcceso nombre="checkmark-circle" />
      <Titulo>Contraseña actualizada</Titulo>
      <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg }]}>
        Desde ahora entras con la contraseña nueva. Las sesiones abiertas en otros equipos se cerraron.
      </Text>
      <Button label="Entrar a USCupo" onPress={() => router.replace('/')} />
    </>
  );
}

function Invalido({ motivo }: { motivo?: string }) {
  const { colors, spacing, type } = useTheme();
  const router = useRouter();
  return (
    <>
      <IconoAcceso nombre="alert" tono="peligro" />
      <Titulo>Este enlace no sirve</Titulo>
      <Text role="alert" style={[type.body, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg }]}>
        {motivo ?? 'El enlace ya venció o ya se usó. Pide uno nuevo.'}
      </Text>
      <Button label="Pedir otro enlace" onPress={() => router.replace('/recuperar')} />
    </>
  );
}
