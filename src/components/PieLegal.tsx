import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import { RESPONSABLE } from '../models/legal';
import { useTheme } from '../theme/useTheme';

/**
 * Enlaces legales en el teléfono (Login) y en Perfil → Acerca de (Ley 1581: canal para ejercer
 * derechos): Términos, Privacidad, opciones de anuncios y contacto. En tablet y computador el
 * Login usa FooterWeb.
 */
export function PieLegal() {
  const { colors, type } = useTheme();
  const { abrirOpciones } = useConsentimientoAnuncios();
  const estilo = [type.bodyMuted, styles.enlace, { color: colors.link }];

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
      <Link href={`mailto:${RESPONSABLE.correo}`} style={estilo}>
        Escríbenos: {RESPONSABLE.correo}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16 },
  enlace: { textDecorationLine: 'underline', paddingVertical: 8, fontFamily: 'Inter_700Bold' },
});
