import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { cristalBoton } from '../theme/glass';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, loadingLabel, style }: Props) {
  const { colors, radius, minTouchSize, type } = useTheme();
  const isDisabled = disabled || loading;

  const relleno =
    variant === 'primary'
      ? cristalBoton(colors.primary)
      : variant === 'secondary'
        ? cristalBoton(colors.primaryTint, colors.border)
        : { backgroundColor: 'transparent' };
  const textColor = variant === 'primary' ? colors.onPrimary : colors.link;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          ...relleno,
          borderRadius: radius.control,
          minHeight: minTouchSize,
          opacity: isDisabled ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <>
          <ActivityIndicator color={textColor} style={styles.spinner} />
          <Text style={[type.body, { color: textColor, fontFamily: fonts.bodyBold }]}>
            {loadingLabel ?? 'Cargando…'}
          </Text>
        </>
      ) : (
        <Text style={[type.body, { color: textColor, fontFamily: fonts.bodyBold }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  spinner: {
    marginRight: 8,
  },
});
