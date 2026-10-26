import Ionicons from './Iconos';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { hora12 } from '../models/catalogo';
import { glass } from '../theme/glass';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

// Rango de clase: dos píldoras (Desde / Hasta). Al tocar una se despliega un panel con tres
// ruedas —hora, minutos, a.m./p.m.— que se deslizan y encajan como el selector de iOS.

const ALTO = 40;
const VISIBLES = 5;

interface Opcion {
  valor: string;
  etiqueta: string;
}

const HORAS: Opcion[] = Array.from({ length: 12 }, (_, i) => ({ valor: String(i + 1), etiqueta: String(i + 1) }));
const MINUTOS: Opcion[] = Array.from({ length: 12 }, (_, i) => {
  const m = String(i * 5).padStart(2, '0');
  return { valor: m, etiqueta: m };
});
const PERIODOS: Opcion[] = [
  { valor: 'am', etiqueta: 'a.m.' },
  { valor: 'pm', etiqueta: 'p.m.' },
];

/** "14:30" → { h: "2", m: "30", p: "pm" } */
function partir(hhmm: string) {
  const [h24, m] = hhmm.split(':').map(Number);
  return { h: String(h24 % 12 === 0 ? 12 : h24 % 12), m: String(m - (m % 5)).padStart(2, '0'), p: h24 < 12 ? 'am' : 'pm' };
}

function unir(h: string, m: string, p: string): string {
  const h24 = (Number(h) % 12) + (p === 'pm' ? 12 : 0);
  return `${String(h24).padStart(2, '0')}:${m}`;
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function duracion(inicio: string, fin: string): string | null {
  const d = aMinutos(fin) - aMinutos(inicio);
  if (d <= 0) return null;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}

type Extremo = 'inicio' | 'fin';

export function RangoHoras({ inicio, fin, onInicio, onFin }: { inicio: string; fin: string; onInicio: (v: string) => void; onFin: (v: string) => void }) {
  const { colors, type, spacing } = useTheme();
  const reducir = useReducedMotion();
  const [abierto, setAbierto] = useState<Extremo | null>(null);
  const aparicion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!abierto) return;
    aparicion.setValue(reducir ? 1 : 0);
    if (!reducir) animarResorte(aparicion, 1, resorte.suave).start();
  }, [abierto, reducir, aparicion]);

  const alternar = (e: Extremo) => setAbierto((a) => (a === e ? null : e));
  const dur = duracion(inicio, fin);
  const valor = abierto === 'fin' ? fin : inicio;
  const cambiar = abierto === 'fin' ? onFin : onInicio;
  const { h, m, p } = partir(valor);

  return (
    <View>
      <View style={styles.pildoras}>
        <PildoraHora titulo="Desde" valor={inicio} activa={abierto === 'inicio'} onPress={() => alternar('inicio')} />
        <PildoraHora titulo="Hasta" valor={fin} activa={abierto === 'fin'} onPress={() => alternar('fin')} />
      </View>

      {dur ? (
        <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.sm }]}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} /> {dur} de clase
        </Text>
      ) : null}

      {abierto ? (
        <Animated.View
          style={[
            styles.panel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              marginTop: spacing.sm,
              opacity: aparicion,
              transform: [
                { translateY: aparicion.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) },
                { scale: aparicion.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.cabecera}>
            <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
              {abierto === 'inicio' ? 'Hora de inicio' : 'Hora de fin'}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => setAbierto(null)} hitSlop={8} style={[styles.listo, { backgroundColor: colors.primary }]}>
              <Text style={[type.bodyMuted, { color: colors.onPrimary, fontFamily: fonts.bodyBold }]}>Listo</Text>
            </Pressable>
          </View>

          <View style={styles.ruedas}>
            <View
              pointerEvents="none"
              style={[styles.banda, { backgroundColor: colors.primaryTint, borderColor: colors.border, top: ALTO * Math.floor(VISIBLES / 2) }]}
            />
            {/* key por extremo: al cambiar de Desde a Hasta las ruedas arrancan en su propio valor */}
            <Rueda key={`${abierto}-h`} etiqueta="Hora" opciones={HORAS} valor={h} onCambiar={(v) => cambiar(unir(v, m, p))} ancho={64} />
            <Text style={[type.cardTitle, { color: colors.text, fontSize: 22 }]}>:</Text>
            <Rueda key={`${abierto}-m`} etiqueta="Minutos" opciones={MINUTOS} valor={m} onCambiar={(v) => cambiar(unir(h, v, p))} ancho={64} />
            <Rueda key={`${abierto}-p`} etiqueta="a.m. o p.m." opciones={PERIODOS} valor={p} onCambiar={(v) => cambiar(unir(h, m, v))} ancho={76} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function PildoraHora({ titulo, valor, activa, onPress }: { titulo: string; valor: string; activa: boolean; onPress: () => void }) {
  const { colors, type } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: activa }}
      accessibilityLabel={`${titulo}: ${hora12(valor)}`}
      onPress={onPress}
      style={({ hovered, pressed }: { hovered?: boolean; pressed: boolean }) => [
        styles.pildora,
        {
          borderColor: activa ? colors.primary : colors.border,
          backgroundColor: activa ? colors.primaryTint : hovered ? colors.primaryTint : colors.surface,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.tituloPildora}>
        <Text style={[type.bodyMuted, { color: colors.textMuted, fontSize: 12 }]}>{titulo}</Text>
        <Ionicons name={activa ? 'chevron-up' : 'chevron-down'} size={14} color={activa ? colors.link : colors.textMuted} />
      </View>
      <Text numberOfLines={1} style={[type.cardTitle, { color: colors.text, fontSize: 17, lineHeight: 24 }]}>
        {hora12(valor)}
      </Text>
    </Pressable>
  );
}

// ── Rueda ────────────────────────────────────────────────────────────────────────
// ScrollView con encaje por ítem hecho por el temporizador (CSS scroll-snap re-encaja al
// primer ítem cada vez que cambian los estilos animados). Cada ítem
// se desvanece y encoge según su distancia al centro, así la rueda se siente continua.

function Rueda({ opciones, valor, onCambiar, etiqueta, ancho }: { opciones: Opcion[]; valor: string; onCambiar: (v: string) => void; etiqueta: string; ancho: number }) {
  const { colors, type } = useTheme();
  const ref = useRef<ScrollView>(null);
  const indice = Math.max(0, opciones.findIndex((o) => o.valor === valor));
  const y = useRef(new Animated.Value(indice * ALTO)).current;
  const actual = useRef(indice);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  // onLayout se repite mientras el panel anima su escala: solo la primera vez coloca la rueda.
  const colocada = useRef(false);

  const ir = (i: number, animado = true) => ref.current?.scrollTo({ y: i * ALTO, animated: animado });

  // Si el valor cambia desde fuera (teclado, lector de pantalla), la rueda lo sigue.
  useEffect(() => {
    if (actual.current !== indice) {
      actual.current = indice;
      ir(indice);
    }
  }, [indice]);

  useEffect(() => () => {
    if (espera.current) clearTimeout(espera.current);
  }, []);

  const fijar = (i: number) => {
    const n = Math.min(opciones.length - 1, Math.max(0, i));
    if (n !== actual.current) {
      actual.current = n;
      onCambiar(opciones[n].valor);
    }
    return n;
  };

  // Se confirma cuando el desplazamiento se detiene (web no emite onMomentumScrollEnd).
  const alDesplazar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const off = e.nativeEvent.contentOffset.y;
    y.setValue(off);
    if (espera.current) clearTimeout(espera.current);
    espera.current = setTimeout(() => {
      const n = fijar(Math.round(off / ALTO));
      if (Math.abs(off - n * ALTO) > 1) ir(n);
    }, 120);
  };

  // onKeyDown no está en los tipos de View, pero react-native-web lo conecta al DOM.
  const teclado = {
    tabIndex: 0 as const,
    onKeyDown: (e: { key: string; preventDefault: () => void }) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      ir(fijar(actual.current + (e.key === 'ArrowDown' ? 1 : -1)));
    },
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ text: opciones[indice].etiqueta }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => ir(fijar(actual.current + (e.nativeEvent.actionName === 'increment' ? 1 : -1)))}
      style={[styles.rueda, { width: ancho }]}
      {...teclado}
    >
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={alDesplazar}
        onLayout={() => {
          if (colocada.current) return;
          colocada.current = true;
          ir(indice, false);
        }}
        contentContainerStyle={{ paddingVertical: ALTO * Math.floor(VISIBLES / 2) }}
        style={{ scrollbarWidth: 'none' } as ViewStyle}
      >
        {opciones.map((o, i) => {
          const rango = { inputRange: [(i - 2) * ALTO, i * ALTO, (i + 2) * ALTO], extrapolate: 'clamp' as const };
          return (
            <Pressable
              key={o.valor}
              onPress={() => ir(i)}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={styles.item}
            >
              <Animated.Text
                style={[
                  type.cardTitle,
                  {
                    fontSize: 20,
                    lineHeight: 26,
                    color: colors.text,
                    opacity: y.interpolate({ ...rango, outputRange: [0.25, 1, 0.25] }),
                    transform: [{ scale: y.interpolate({ ...rango, outputRange: [0.82, 1, 0.82] }) }],
                  },
                ]}
              >
                {o.etiqueta}
              </Animated.Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pildoras: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  pildora: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: glass.panel,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  tituloPildora: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panel: {
    borderWidth: 1,
    borderRadius: glass.panel,
    padding: 12,
    boxShadow: '0px 18px 40px -24px rgba(10,41,89,0.45)',
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 4 },
  listo: { borderRadius: glass.pill, paddingHorizontal: 14, paddingVertical: 6 },
  ruedas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: ALTO * VISIBLES },
  banda: { position: 'absolute', left: 0, right: 0, height: ALTO, borderRadius: glass.pill, borderWidth: 1 },
  rueda: { height: ALTO * VISIBLES, overflow: 'hidden' },
  item: { height: ALTO, alignItems: 'center', justifyContent: 'center' },
});
