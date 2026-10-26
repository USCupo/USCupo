import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.fila}>
        <Pressable
          role="checkbox"
          aria-checked={aceptado}
          accessibilityLabel="Acepto los Términos de uso y la Política de privacidad"
          accessibilityState={{ checked: aceptado, disabled }}
          onPress={() => onCambiar(!aceptado)}
          disabled={disabled}
          style={[styles.toque, { width: minTouchSize, height: minTouchSize }]}
        >
          <View
            style={[
              styles.caja,
              {
                backgroundColor: aceptado ? colors.primary : colors.surface,
                borderColor: error ? colors.danger : aceptado ? colors.primary : colors.border,
              },
            ]}
          >
            {aceptado && <Text style={[styles.check, { color: colors.onPrimary }]}>✓</Text>}
          </View>
        </Pressable>
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
      </View>
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
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  toque: { alignItems: 'center', justifyContent: 'center' },
  caja: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
  texto: { flex: 1, paddingTop: 12 },
  enlace: { fontFamily: fonts.bodyBold, textDecorationLine: 'underline' },
});
