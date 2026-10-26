import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

interface Props {
  options: [string, string];
  selectedIndex: 0 | 1;
  onChange: (index: 0 | 1) => void;
}

const PADDING = 4;

export function SegmentedControl({ options, selectedIndex, onChange }: Props) {
  const { colors, radius, minTouchSize } = useTheme();
  const reducir = useReducedMotion();
  const [anchoSegmento, setAnchoSegmento] = useState(0);
  const x = useRef(new Animated.Value(selectedIndex)).current;

  // El indicador viaja desde su posición actual: si el usuario cambia a mitad de camino,
  // el resorte se redirige sin saltos.
  useEffect(() => {
    if (reducir) x.setValue(selectedIndex);
    else animarResorte(x, selectedIndex, resorte.suave).start();
  }, [selectedIndex, reducir, x]);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setAnchoSegmento((e.nativeEvent.layout.width - PADDING * 2) / options.length)}
      style={[styles.track, { backgroundColor: colors.primaryTint, borderRadius: radius.control }]}
    >
      {anchoSegmento > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: anchoSegmento,
              borderRadius: radius.control - 2,
              backgroundColor: colors.surface,
              transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, anchoSegmento] }) }],
            },
          ]}
        />
      )}
      {options.map((label, index) => {
        const selected = index === selectedIndex;
        return (
          <Pressable
            key={label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(index as 0 | 1)}
            style={[styles.segment, { minHeight: minTouchSize - 4, borderRadius: radius.control - 2 }]}
          >
            <Text
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 15,
                color: selected ? colors.link : colors.textMuted,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PADDING,
  },
  thumb: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
