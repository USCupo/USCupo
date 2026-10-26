import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { CarreraPicker } from '../../src/components/CarreraPicker';
import { Casilla } from '../../src/components/Casilla';
import { CasillaLegal } from '../../src/components/CasillaLegal';
import { InfoNotice } from '../../src/components/InfoNotice';
import { MarcoAcceso } from '../../src/components/MarcoAcceso';
import { MicrosoftButton } from '../../src/components/MicrosoftButton';
import { PieLegal } from '../../src/components/PieLegal';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { TextField } from '../../src/components/TextField';
import { MIN_CONTRASENA } from '../../src/controllers/auth';
import { useLoginController, type LoginController } from '../../src/controllers/useLoginController';
import { llevarCorreoARecuperar } from '../../src/controllers/useRecuperarController';
import { DIAS_RECORDAR } from '../../src/lib/sesion';
import { USC_EMAIL_DOMAIN } from '../../src/lib/supabase';
import { AVISO_NO_OFICIAL } from '../../src/models/legal';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';
import { MetaPagina } from '../../src/components/MetaPagina';
import { fonts } from '../../src/theme/typography';

// react-native-web pasa dataSet como atributos data-*; los tipos de React Native no lo declaran.
const ENTRADA = { dataSet: { entrada: '' } } as object;

const DESCRIPCION_LOGIN =
  'Ingresa o crea tu cuenta de USCupo con tu correo @usc.edu.co para cambiar de horario con otros estudiantes de la Universidad Santiago de Cali.';

export default function LoginScreen() {
  // El controlador vive aquí y no dentro del formulario: si la ventana cruza un
  // breakpoint, el layout cambia pero lo escrito se conserva.
  const { modo } = useLocalSearchParams<{ modo?: string }>();
  const c = useLoginController(modo === 'ingreso' ? 'ingreso' : 'registro');
  return (
    <MarcoAcceso meta={<MetaPagina titulo="Ingresar" ruta="/login" descripcion={DESCRIPCION_LOGIN} />}>
      <Formulario c={c} />
    </MarcoAcceso>
  );
}

function Formulario({ c }: { c: LoginController }) {
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const router = useRouter();
  const registro = c.modo === 'registro';
  const ocupado = c.enviando || c.microsoftCargando;

  return (
    // Un solo momento de entrada: el formulario sube y aparece al pintar. Es CSS (data-entrada en
    // app/+html.tsx) para que corra con el HTML del build sin esperar a JS.
    <View {...ENTRADA}>
      <SegmentedControl
        options={['Crear cuenta', 'Iniciar sesión']}
        selectedIndex={registro ? 0 : 1}
        onChange={(i) => c.setModo(i === 0 ? 'registro' : 'ingreso')}
      />

      <View style={{ marginTop: spacing.lg }}>
        <Text role="heading" aria-level={2} style={[type.screenTitle, { color: colors.text, fontSize: 24, lineHeight: 30 }]}>
          {registro ? 'Crea tu cuenta' : 'Inicia sesión'}
        </Text>
        <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg }]}>
          Solo estudiantes con correo institucional{' '}
          <Text style={{ color: colors.accentText, fontFamily: fonts.bodyBold }}>@{USC_EMAIL_DOMAIN}</Text>
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

        {!registro && (
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              llevarCorreoARecuperar(c.campos.correo);
              router.push('/recuperar');
            }}
            disabled={ocupado}
            style={[styles.olvide, { marginTop: -spacing.sm, marginBottom: spacing.sm }]}
          >
            <Text style={[type.bodyMuted, { color: colors.link, fontFamily: fonts.bodyBold }]}>¿Olvidaste tu contraseña?</Text>
          </Pressable>
        )}

        {!registro && (
          <View style={{ marginBottom: spacing.md }}>
            <Casilla
              marcada={c.campos.recordar}
              onCambiar={c.setRecordar}
              etiqueta={`Mantener sesión iniciada por ${DIAS_RECORDAR} días`}
              disabled={ocupado}
            >
              <View style={styles.textoCasilla}>
                <Text style={[type.body, { color: colors.text }]}>Mantener sesión iniciada</Text>
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
                  {`${DIAS_RECORDAR} días en este equipo. Si no la marcas, la sesión se cierra al cerrar la pestaña.`}
                </Text>
              </View>
            </Casilla>
          </View>
        )}

        {registro && (
          <CasillaLegal
            aceptado={c.campos.aceptaLegal}
            onCambiar={c.setAceptaLegal}
            error={c.errores.legal}
            disabled={ocupado}
          />
        )}

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

        {c.porConfirmar && (
          <View style={{ marginBottom: spacing.md }}>
            <Button
              variant="secondary"
              label={c.reenvio.espera > 0 ? `Reenviar confirmación en ${c.reenvio.espera} s` : 'Reenviar correo de confirmación'}
              loadingLabel="Enviando…"
              onPress={c.reenviar}
              loading={c.reenvio.enviando}
              disabled={c.reenvio.espera > 0}
            />
            {c.reenvio.hecho ? (
              <Text accessibilityLiveRegion="polite" style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }]}>
                {`Enviamos otro enlace a ${c.porConfirmar}. Revisa también el correo no deseado.`}
              </Text>
            ) : null}
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
            <Text style={{ color: colors.link, fontFamily: fonts.bodyBold }}>
              {registro ? 'Inicia sesión' : 'Crear cuenta'}
            </Text>
          </Text>
        </Pressable>

        <View style={{ marginTop: spacing.md }}>
          <InfoNotice>
            {`USCupo solo conecta estudiantes. La gestión del cambio de horario se hace directamente en los canales oficiales de la USC. ${AVISO_NO_OFICIAL}`}
          </InfoNotice>
        </View>

        {/* En tablet y computador los enlaces legales van en el FooterWeb. */}
        {breakpoint === 'compacto' ? (
          <View style={{ marginTop: spacing.sm }}>
            <PieLegal />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  olvide: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  textoCasilla: {
    flex: 1,
    paddingTop: 10,
    gap: 2,
  },
  lineaDivisor: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
