import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import { RESPONSABLE } from '../models/legal';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

/**
 * Enlaces legales (Ley 1581: el contacto es el canal para ejercer derechos): Acerca de, Términos,
 * Privacidad, opciones de anuncios y, salvo que se pida lo contrario, contacto. Una sola lista
 * para el Login del teléfono, Perfil y el FooterWeb; `sobreOscuro` es para el cristal oscuro.
 */
export function PieLegal({ sobreOscuro, conContacto = true, centrado }: { sobreOscuro?: boolean; conContacto?: boolean; centrado?: boolean }) {
  const { colors, type } = useTheme();
  const { abrirOpciones } = useConsentimientoAnuncios();
  const estilo = [type.bodyMuted, styles.enlace, sobreOscuro ? { color: colors.onBackground, fontSize: 13, paddingVertical: 10 } : { color: colors.link }];

  return (
    <View role="navigation" aria-label="Información legal" style={[styles.enlaces, centrado && styles.centrado]}>
      <Link href="/acerca" style={estilo}>
        Acerca de
      </Link>
      <Link href="/terminos" style={estilo}>
        Términos de uso
      </Link>
      <Link href="/privacidad" style={estilo}>
        Política de privacidad
      </Link>
      <Pressable accessibilityRole="button" onPress={abrirOpciones}>
        {/* Mismo nombre que el aviso que abre. */}
        <Text style={estilo}>Cookies y publicidad</Text>
      </Pressable>
      {conContacto ? (
        sobreOscuro ? (
          <Link href="/contacto" style={estilo}>
            Contacto
          </Link>
        ) : (
          <Link href={`mailto:${RESPONSABLE.correo}`} style={estilo}>
            {`Escríbenos: ${RESPONSABLE.correo}`}
          </Link>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // flexShrink + maxWidth: dentro del FooterWeb, si no caben en una fila pasan a la siguiente.
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, flexShrink: 1, maxWidth: '100%' },
  centrado: { justifyContent: 'center' },
  enlace: { textDecorationLine: 'underline', paddingVertical: 8, fontFamily: fonts.bodyBold },
});
