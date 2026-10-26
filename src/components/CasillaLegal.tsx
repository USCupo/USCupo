import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Casilla } from './Casilla';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

// Autorización de tratamiento de datos (Ley 1581): previa, expresa e informada. Nunca viene marcada
// y los dos documentos se pueden abrir antes de aceptar (en otra pestaña, sin perder el formulario).
export function CasillaLegal({
  aceptado,
  onCambiar,
  error,
  disabled,
}: {
  aceptado: boolean;
  onCambiar: (v: boolean) => void;
  error?: string;
  disabled?: boolean;
}) {
  const { colors, type, minTouchSize } = useTheme();
  const enlace = [styles.enlace, { color: colors.link }];

  return (
    <View style={styles.raiz}>
      <Casilla
        marcada={aceptado}
        onCambiar={onCambiar}
        etiqueta="Acepto los Términos de uso y la Política de privacidad"
        error={error}
        disabled={disabled}
      >
        <Text style={[type.bodyMuted, styles.texto, { color: colors.textMuted }]}>
          Acepto los{' '}
          <Link href="/terminos" target="_blank" style={enlace}>
            Términos de uso
          </Link>{' '}
          y autorizo el tratamiento de mis datos personales según la{' '}
          <Link href="/privacidad" target="_blank" style={enlace}>
            Política de privacidad
          </Link>
          .
        </Text>
      </Casilla>
      {error ? (
        <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginLeft: minTouchSize + 8 }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { marginBottom: 16 },
  texto: { flex: 1, paddingTop: 12 },
  enlace: { fontFamily: fonts.bodyBold, textDecorationLine: 'underline' },
});
