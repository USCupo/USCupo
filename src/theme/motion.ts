import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform } from 'react-native';

// Animated corre en el hilo nativo en iOS/Android; en web no existe ese driver.
export const useNativeDriver = Platform.OS !== 'web';

// Resortes críticamente amortiguados (sin rebote) para UI; un toque de rebote solo en el
// interruptor de tema, que es una acción física de "lanzar" la perilla.
export const resorte = {
  suave: { damping: 26, stiffness: 260, mass: 1 },
  vivo: { damping: 18, stiffness: 320, mass: 0.9 },
} as const;

export function animarResorte(valor: Animated.Value, toValue: number, config: { damping: number; stiffness: number; mass: number }) {
  return Animated.spring(valor, { toValue, ...config, useNativeDriver });
}

export function useReducedMotion(): boolean {
  const [reducir, setReducir] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducir).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducir);
    return () => sub.remove();
  }, []);

  return reducir;
}
