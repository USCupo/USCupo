import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import { RESPONSABLE } from '../models/legal';
import { useTheme } from '../theme/useTheme';

/**
 * Enlaces legales (Ley 1581: el contacto es el canal para ejercer derechos): Términos,
 * Privacidad, opciones de anuncios y, salvo que se pida lo contrario, contacto. Una sola lista
 * para el Login del teléfono, Perfil y el FooterWeb; `sobreOscuro` es para el cristal oscuro.
 */
export function PieLegal({ sobreOscuro, conContacto = true }: { sobreOscuro?: boolean; conContacto?: boolean }) {
  const { colors, type } = useTheme();
  const { abrirOpciones } = useConsentimientoAnuncios();
  const estilo = [type.bodyMuted, styles.enlace, sobreOscuro ? { color: colors.onBackground, fontSize: 13, paddingVertical: 10 } : { color: colors.link }];

  return (
    <View role="navigation" aria-label="Información legal" style={styles.enlaces}>
      <Link href="/terminos" style={estilo}>
        Términos de uso
      </Link>
      <Link href="/privacidad" style={estilo}>
        Política de privacidad
      </Link>
      <Pressable accessibilityRole="button" onPress={abrirOpciones}>
        <Text style={estilo}>Opciones de privacidad de anuncios</Text>
      </Pressable>
      {conContacto ? (
        <Link href={`mailto:${RESPONSABLE.correo}`} style={estilo}>
          {sobreOscuro ? 'Contacto' : `Escríbenos: ${RESPONSABLE.correo}`}
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  enlace: { textDecorationLine: 'underline', paddingVertical: 8, fontFamily: 'Inter_700Bold' },
});
