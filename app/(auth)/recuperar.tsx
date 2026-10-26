import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { InfoNotice } from '../../src/components/InfoNotice';
import { IconoAcceso, MarcoAcceso } from '../../src/components/MarcoAcceso';
import { MetaPagina } from '../../src/components/MetaPagina';
import { TextField } from '../../src/components/TextField';
import { useRecuperarController, type RecuperarController } from '../../src/controllers/useRecuperarController';
import { USC_EMAIL_DOMAIN } from '../../src/lib/supabase';
import { fonts } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/useTheme';

// react-native-web pasa dataSet como atributos data-*; los tipos de React Native no lo declaran.
const ENTRADA = { dataSet: { entrada: '' } } as object;

export default function RecuperarScreen() {
  const c = useRecuperarController();
  return (
    <MarcoAcceso meta={<MetaPagina titulo="Recuperar contraseña" />}>
      <View {...ENTRADA}>{c.enviadoA ? <Enviado c={c} /> : <Formulario c={c} />}</View>
    </MarcoAcceso>
  );
}

function Formulario({ c }: { c: RecuperarController }) {
  const { colors, spacing, type } = useTheme();
  return (
    <>
      <IconoAcceso nombre="mail-outline" />
      <Text role="heading" aria-level={2} style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}>
        Recupera tu contraseña
      </Text>
      <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
        Escribe tu correo institucional y te enviamos un enlace para crear una nueva.
      </Text>

      <TextField
        label="Correo institucional"
        placeholder={`tu.nombre@${USC_EMAIL_DOMAIN}`}
        value={c.correo}
        onChangeText={c.cambiarCorreo}
        onBlur={c.validarCorreo}
        onSubmitEditing={c.enviar}
        error={c.errorCampo}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="username"
        editable={!c.enviando}
      />

      {c.errorFormulario ? (
        <Text role="alert" accessibilityLiveRegion="polite" style={[type.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>
          {c.errorFormulario}
        </Text>
      ) : null}

      <Button label="Enviar enlace" loadingLabel="Enviando…" onPress={c.enviar} loading={c.enviando} />

      <View style={{ marginTop: spacing.lg }}>
        <InfoNotice>
          Si entras con tu cuenta de Microsoft, tu contraseña es la de la USC y se cambia en Microsoft 365.
        </InfoNotice>
      </View>

      <VolverAlLogin />
    </>
  );
}

function Enviado({ c }: { c: RecuperarController }) {
  const { colors, spacing, type } = useTheme();
  return (
    <>
      <IconoAcceso nombre="mail-outline" />
      <Text role="heading" aria-level={2} style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}>
        Revisa tu correo
      </Text>
      <Text accessibilityLiveRegion="polite" style={[type.body, { color: colors.textMuted, marginTop: spacing.sm }]}>
        Si hay una cuenta de USCupo con{' '}
        <Text style={{ color: colors.text, fontFamily: fonts.bodyBold }}>{c.enviadoA}</Text>, te llegará un enlace para
        crear una contraseña nueva. El enlace vence en una hora.
      </Text>
      <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.lg }]}>
        ¿No llega? Revisa la carpeta de correo no deseado.
      </Text>

      {c.errorFormulario ? (
        <Text role="alert" accessibilityLiveRegion="polite" style={[type.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>
          {c.errorFormulario}
        </Text>
      ) : null}

      <Button
        variant="secondary"
        label={c.espera > 0 ? `Reenviar en ${c.espera} s` : 'Reenviar enlace'}
        loadingLabel="Enviando…"
        onPress={c.enviar}
        loading={c.enviando}
        disabled={c.espera > 0}
      />
      <Pressable
        accessibilityRole="button"
        onPress={c.otroCorreo}
        style={{ marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm }}
      >
        <Text style={[type.bodyMuted, { color: colors.link, fontFamily: fonts.bodyBold }]}>Usar otro correo</Text>
      </Pressable>

      <VolverAlLogin />
    </>
  );
}

function VolverAlLogin() {
  const { colors, spacing, type } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
      style={{ marginTop: spacing.sm, alignItems: 'center', paddingVertical: spacing.sm }}
    >
      <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
        ¿La recordaste? <Text style={{ color: colors.link, fontFamily: fonts.bodyBold }}>Inicia sesión</Text>
      </Text>
    </Pressable>
  );
}
