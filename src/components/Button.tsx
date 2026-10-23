import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';

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

  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.primaryTint : 'transparent';
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
          backgroundColor,
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
          <Text style={[type.body, { color: textColor, fontFamily: 'Inter_700Bold' }]}>
            {loadingLabel ?? 'Cargando…'}
          </Text>
        </>
      ) : (
        <Text style={[type.body, { color: textColor, fontFamily: 'Inter_700Bold' }]}>{label}</Text>
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
