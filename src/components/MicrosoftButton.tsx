import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';

// Logo oficial de Microsoft (cuatro cuadros) con sus colores de marca, sin modificar.
function MicrosoftLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21">
      <Rect x={1} y={1} width={9} height={9} fill="#F25022" />
      <Rect x={11} y={1} width={9} height={9} fill="#7FBA00" />
      <Rect x={1} y={11} width={9} height={9} fill="#00A4EF" />
      <Rect x={11} y={11} width={9} height={9} fill="#FFB900" />
    </Svg>
  );
}

interface Props {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function MicrosoftButton({ onPress, loading, disabled }: Props) {
  const { colors, radius, minTouchSize, type } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Iniciar sesión con Microsoft"
      accessibilityHint="Usa tu cuenta institucional de la USC"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.base,
        {
          minHeight: minTouchSize + 4,
          borderRadius: radius.control,
          borderColor: hovered ? colors.link : colors.border,
          backgroundColor: hovered ? colors.primaryTint : colors.surface,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={styles.icono}>
        {loading ? <ActivityIndicator color={colors.link} /> : <MicrosoftLogo />}
      </View>
      <Text style={[type.body, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        {loading ? 'Conectando con Microsoft…' : 'Iniciar sesión con Microsoft'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 20,
    gap: 12,
  },
  icono: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
