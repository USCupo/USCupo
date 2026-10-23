import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

// Google AdSense en web. Se activa con dos variables de entorno:
//   EXPO_PUBLIC_ADSENSE_CLIENT  ca-pub-XXXXXXXXXXXXXXXX (id de editor)
//   y el id de cada bloque de anuncio (data-ad-slot) que se pasa por prop.
// Sin cliente configurado: en desarrollo se ve un marco punteado; en producción no se pinta nada.

const CLIENTE = process.env.EXPO_PUBLIC_ADSENSE_CLIENT;
const SCRIPT_ID = 'adsbygoogle-js';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function cargarScript(cliente: string) {
  if (document.getElementById(SCRIPT_ID)) return;
  const s = document.createElement('script');
  s.id = SCRIPT_ID;
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cliente}`;
  document.head.appendChild(s);
}

export function EspacioAnuncio({ slot, alto = 120 }: { slot?: string; alto?: number }) {
  const { colors, type, radius } = useTheme();
  const pedido = useRef(false);
  const activo = !!CLIENTE && !!slot;

  useEffect(() => {
    if (!activo || pedido.current) return;
    cargarScript(CLIENTE!);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pedido.current = true;
    } catch {
      // Bloqueador de anuncios o script aún sin cargar: el hueco queda vacío.
    }
  }, [activo]);

  if (!activo) {
    if (!__DEV__) return null;
    return (
      <View
        accessibilityLabel="Espacio publicitario"
        style={[styles.reserva, { minHeight: alto, borderColor: colors.onBackgroundBorder, borderRadius: radius.card + 8 }]}
      >
        <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted }]}>Espacio publicitario</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 4 }}>
      <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, fontSize: 12 }]}>Publicidad</Text>
      <View style={{ minHeight: alto, borderRadius: radius.card + 8, overflow: 'hidden' }}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: alto }}
          data-ad-client={CLIENTE}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reserva: { borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
