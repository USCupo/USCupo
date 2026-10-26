import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

// Casilla marcable con su texto al lado. El área de toque es de minTouchSize aunque la caja mida 22.
export function Casilla({
  marcada,
  onCambiar,
  etiqueta,
  children,
  error,
  disabled,
}: {
  marcada: boolean;
  onCambiar: (v: boolean) => void;
  /** Nombre para lectores de pantalla; el texto visible va en children. */
  etiqueta: string;
  children: ReactNode;
  error?: string;
  disabled?: boolean;
}) {
  const { colors, minTouchSize } = useTheme();

  return (
    <View style={styles.fila}>
      <Pressable
        role="checkbox"
        aria-checked={marcada}
        accessibilityLabel={etiqueta}
        accessibilityState={{ checked: marcada, disabled }}
        onPress={() => onCambiar(!marcada)}
        disabled={disabled}
        style={[styles.toque, { width: minTouchSize, height: minTouchSize }]}
      >
        <View
          style={[
            styles.caja,
            {
              backgroundColor: marcada ? colors.primary : colors.surface,
              borderColor: error ? colors.danger : marcada ? colors.primary : colors.border,
            },
          ]}
        >
          {marcada && <Text style={[styles.check, { color: colors.onPrimary }]}>✓</Text>}
        </View>
      </Pressable>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  toque: { alignItems: 'center', justifyContent: 'center' },
  caja: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 14, fontWeight: '700', lineHeight: 16 },
});
