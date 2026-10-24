import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useConsentimientoAnuncios } from '../controllers/useConsentimientoAnuncios';
import { RESPONSABLE } from '../models/legal';
import { useTheme } from '../theme/useTheme';

/**
 * Enlaces legales (Ley 1581: canal para ejercer derechos): Términos, Privacidad, opciones de
 * anuncios, Eliminar cuenta y contacto. Perfil ya tiene su botón de eliminar, así que lo omite.
 */
export function PieLegal({ conEliminarCuenta = true }: { conEliminarCuenta?: boolean }) {
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
      {conEliminarCuenta ? (
        <Link href="/eliminar-cuenta" style={estilo}>
          Eliminar cuenta
        </Link>
      ) : null}
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
