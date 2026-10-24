import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

export function InfoNotice({ children }: { children: string }) {
  const { colors, radius, spacing, type } = useTheme();

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: colors.primaryTint, borderRadius: radius.card, padding: spacing.md },
      ]}
    >
      <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 8,
  },
});
