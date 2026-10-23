import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  /** Campo de contraseña con botón para mostrar u ocultar el texto. */
  password?: boolean;
}

export function TextField({ label, error, style, password, onFocus, onBlur, ...rest }: Props) {
  const { colors, radius, spacing, type, minTouchSize } = useTheme();
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.link : colors.border;

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: 'Inter_700Bold', marginBottom: spacing.xs }]}>
        {label}
      </Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && !visible}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            type.body,
            styles.input,
            {
              minHeight: minTouchSize + 4,
              borderRadius: radius.control,
              borderColor,
              backgroundColor: colors.surface,
              color: colors.text,
              paddingRight: password ? minTouchSize + 4 : 14,
              // Anillo de foco visible (teclado y mouse) sin mover el layout.
              outlineStyle: 'solid',
              outlineWidth: focused ? 3 : 0,
              outlineColor: error ? colors.danger + '33' : colors.primaryTint,
            },
            style,
          ]}
          {...rest}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            onPress={() => setVisible((v) => !v)}
            hitSlop={6}
            style={({ pressed }) => [styles.eye, { width: minTouchSize, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          role="alert"
          style={[type.bodyMuted, { color: colors.danger, marginTop: spacing.xs }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  eye: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
