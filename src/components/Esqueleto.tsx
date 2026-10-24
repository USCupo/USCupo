import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion, useNativeDriver } from '../theme/motion';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Tarjeta } from './ui';

// Skeleton loader: bloques con la forma del contenido que viene, en el tinte de la paleta USC.
// Todos los huesos de un mismo grupo laten con un único valor animado para ir sincronizados.

const Pulso = createContext<Animated.Value | null>(null);

export function GrupoEsqueleto({ children, etiqueta = 'Cargando…' }: { children: ReactNode; etiqueta?: string }) {
  const reducir = useReducedMotion();
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducir) {
      pulso.setValue(0.5);
      return;
    }
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver }),
        Animated.timing(pulso, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [reducir, pulso]);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={etiqueta} aria-busy>
      <Pulso.Provider value={pulso}>{children}</Pulso.Provider>
    </View>
  );
}

interface HuesoProps {
  ancho?: DimensionValue;
  alto?: number;
  radio?: number;
  /** Sobre el degradado (fuera de tarjeta): usa el tono claro sobre fondo. */
  sobreFondo?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Hueso({ ancho = '100%', alto = 14, radio = 8, sobreFondo, style }: HuesoProps) {
  const { colors } = useTheme();
  const pulso = useContext(Pulso);
  const opacity = pulso ? pulso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) : 0.8;
  return (
    <Animated.View
      style={[
        { width: ancho, height: alto, borderRadius: radio, backgroundColor: sobreFondo ? colors.onBackgroundBorder : colors.primaryTint, opacity },
        style,
      ]}
    />
  );
}

// ── Piezas ───────────────────────────────────────────────────────────────────────

/** Misma silueta que OfertaCard. */
export function EsqueletoOferta() {
  const { spacing } = useTheme();
  return (
    <Tarjeta padding={spacing.md + 4}>
      <View style={styles.fila}>
        <View style={{ flex: 1, gap: 8 }}>
          <Hueso ancho="60%" alto={18} />
          <Hueso ancho="35%" alto={12} />
        </View>
        <Hueso ancho={64} alto={22} radio={999} />
      </View>
      <View style={[styles.fila, { marginTop: spacing.md, gap: spacing.md }]}>
        <View style={{ flex: 1, gap: 6 }}>
          <Hueso ancho={40} alto={12} />
          <Hueso alto={52} radio={12} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Hueso ancho={44} alto={12} />
          <Hueso alto={52} radio={12} />
        </View>
      </View>
      <View style={[styles.fila, { marginTop: spacing.md, alignItems: 'center' }]}>
        <Hueso ancho={18} alto={18} radio={9} />
        <Hueso ancho="45%" alto={12} />
      </View>
      <Hueso alto={44} radio={999} style={{ marginTop: spacing.md }} />
    </Tarjeta>
  );
}

function EsqueletoTitulo({ ancho = 180 }: { ancho?: number }) {
  return <Hueso sobreFondo ancho={ancho} alto={18} style={{ marginBottom: 8, marginTop: 4 }} />;
}

function EsqueletoTarjetaTexto({ lineas = 3 }: { lineas?: number }) {
  return (
    <Tarjeta>
      <Hueso ancho="40%" alto={16} style={{ marginBottom: 14 }} />
      <View style={{ gap: 10 }}>
        {Array.from({ length: lineas }, (_, i) => (
          <Hueso key={i} ancho={i === lineas - 1 ? '70%' : '100%'} alto={12} />
        ))}
      </View>
    </Tarjeta>
  );
}

function ListaOfertas({ n }: { n: number }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: n }, (_, i) => (
        <EsqueletoOferta key={i} />
      ))}
    </View>
  );
}

// ── Por pantalla ─────────────────────────────────────────────────────────────────

export function EsqueletoInicio() {
  const { spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';
  return (
    <GrupoEsqueleto etiqueta="Cargando tu resumen…">
      <View style={[amplio && styles.columnas, { gap: spacing.lg }]}>
        <View style={[amplio && { flex: 2 }, { gap: spacing.lg }]}>
          <View>
            <EsqueletoTitulo />
            <ListaOfertas n={1} />
          </View>
          <View>
            <EsqueletoTitulo ancho={220} />
            <View style={[styles.filaChips, { marginBottom: spacing.md }]}>
              {[70, 140, 110].map((w) => (
                <Hueso key={w} sobreFondo ancho={w} alto={40} radio={999} />
              ))}
            </View>
            <ListaOfertas n={2} />
          </View>
        </View>
        <View style={[amplio && { flex: 1 }, { gap: spacing.lg }]}>
          <EsqueletoTarjetaTexto lineas={3} />
          <EsqueletoTarjetaTexto lineas={4} />
        </View>
      </View>
    </GrupoEsqueleto>
  );
}

export function EsqueletoBuscar() {
  const { spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';
  const chips = (
    <View style={styles.filaChips}>
      {[90, 120, 100].map((w) => (
        <Hueso key={w} sobreFondo ancho={w} alto={40} radio={999} />
      ))}
    </View>
  );
  return (
    <GrupoEsqueleto etiqueta="Buscando ofertas…">
      {amplio ? (
        <View style={[styles.columnas, { gap: spacing.lg }]}>
          <Tarjeta style={{ width: 300 }} padding={spacing.md}>
            <Hueso ancho="60%" alto={12} style={{ marginBottom: 8 }} />
            <Hueso alto={44} radio={999} style={{ marginBottom: spacing.md }} />
            <View style={{ gap: 14 }}>
              {Array.from({ length: 7 }, (_, i) => (
                <View key={i} style={[styles.fila, { alignItems: 'center' }]}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Hueso ancho={`${85 - (i % 3) * 15}%`} alto={13} />
                    <Hueso ancho="35%" alto={10} />
                  </View>
                  <Hueso ancho={24} alto={22} radio={11} />
                </View>
              ))}
            </View>
          </Tarjeta>
          <View style={{ flex: 1, gap: spacing.lg }}>
            {chips}
            <View style={[styles.rejilla, { gap: spacing.md }]}>
              {Array.from({ length: 4 }, (_, i) => (
                <View key={i} style={styles.mitad}>
                  <EsqueletoOferta />
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          <Hueso sobreFondo alto={48} radio={999} />
          {chips}
          <ListaOfertas n={2} />
        </View>
      )}
    </GrupoEsqueleto>
  );
}

export function EsqueletoMisCambios() {
  const { spacing } = useTheme();
  return (
    <GrupoEsqueleto etiqueta="Cargando tus cambios…">
      <View style={{ gap: spacing.lg }}>
        <View>
          <EsqueletoTitulo ancho={160} />
          <ListaOfertas n={1} />
        </View>
        <View>
          <EsqueletoTitulo ancho={200} />
          <ListaOfertas n={2} />
        </View>
      </View>
    </GrupoEsqueleto>
  );
}

export function EsqueletoFormulario() {
  const { spacing } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';
  const campo = (k: number) => (
    <View key={k} style={{ gap: 8, marginTop: spacing.md }}>
      <Hueso ancho="30%" alto={12} />
      <Hueso alto={48} radio={999} />
    </View>
  );
  const seccion = (campos: number) => (
    <Tarjeta style={amplio ? { flex: 1 } : undefined}>
      <View style={[styles.fila, { alignItems: 'center' }]}>
        <Hueso ancho={28} alto={28} radio={14} />
        <Hueso ancho="45%" alto={18} />
      </View>
      {Array.from({ length: campos }, (_, i) => campo(i))}
    </Tarjeta>
  );
  return (
    <GrupoEsqueleto>
      <View style={[amplio && styles.columnas, { gap: spacing.lg }]}>
        {seccion(2)}
        {seccion(3)}
      </View>
    </GrupoEsqueleto>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  filaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  mitad: { flexBasis: '47%', flexGrow: 1, minWidth: 300 },
});
