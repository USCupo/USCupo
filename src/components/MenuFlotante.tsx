import Ionicons from './Iconos';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewInstance, type ViewStyle } from 'react-native';
import { conAlfa, cristalClaro } from '../theme/glass';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

type IconName = ComponentProps<typeof Ionicons>['name'];

export interface OpcionMenuFlotante {
  texto: string;
  icono: IconName;
  color: string;
  fondo: string;
  onPress: () => void;
}

const ANCHO_MENU = 240;
const RADIO_MENU = 32;

/**
 * Botón que abre un menú de cristal (menú ⋮ de las tarjetas, menú de cuenta de la navbar). Va en
 * un Modal para que nada lo tape; Escape y el clic fuera lo cierran, y el foco entra en la
 * primera opción. Cerca del borde inferior se abre hacia arriba.
 */
export function MenuFlotante({
  etiquetaBoton,
  etiquetaMenu,
  opciones,
  estiloBoton,
  actual,
  children,
}: {
  etiquetaBoton: string;
  etiquetaMenu: string;
  opciones: OpcionMenuFlotante[];
  estiloBoton: (estado: { pressed: boolean; hovered?: boolean; abierto: boolean }) => StyleProp<ViewStyle>;
  /** El botón representa la página en la que se está (avatar en Perfil). */
  actual?: boolean;
  children: ReactNode;
}) {
  const { colors, minTouchSize } = useTheme();
  const { width, height } = useWindowDimensions();
  const reducir = useReducedMotion();
  const boton = useRef<ViewInstance>(null);
  const entrada = useRef(new Animated.Value(0)).current;
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  const abrir = () => {
    boton.current?.measureInWindow((x, y, w, h) => {
      const alto = opciones.length * (minTouchSize + 4) + 16;
      const right = Math.max(8, width - (x + w));
      setPos(y + h + alto + 96 > height ? { bottom: height - y + 4, right } : { top: y + h + 4, right });
    });
  };
  const cerrar = () => setPos(null);
  const elegir = (accion: () => void) => {
    cerrar();
    accion();
  };

  useEffect(() => {
    if (!pos) return;
    entrada.setValue(reducir ? 1 : 0);
    if (!reducir) animarResorte(entrada, 1, resorte.vivo).start();
  }, [pos, reducir, entrada]);

  return (
    <>
      <Pressable
        ref={boton}
        accessibilityRole="button"
        accessibilityLabel={etiquetaBoton}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        aria-current={actual ? 'page' : undefined}
        onPress={abrir}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => estiloBoton({ pressed, hovered, abierto: !!pos })}
      >
        {children}
      </Pressable>

      <Modal visible={!!pos} transparent animationType="none" onRequestClose={cerrar}>
        <Pressable accessibilityLabel="Cerrar menú" onPress={cerrar} style={StyleSheet.absoluteFill} />
        {pos ? (
          <Animated.View
            role="menu"
            accessibilityLabel={etiquetaMenu}
            style={[
              styles.panel,
              cristalClaro(colors),
              {
                ...pos,
                width: Math.min(ANCHO_MENU, width - 16),
                borderRadius: RADIO_MENU,
                borderColor: conAlfa(colors.border, 0.9),
                opacity: entrada,
                transformOrigin: pos.top !== undefined ? 'top right' : 'bottom right',
                transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }],
              },
            ]}
          >
            {opciones.map((o, i) => (
              <OpcionMenu key={o.texto} {...o} enfocar={i === 0} onPress={() => elegir(o.onPress)} />
            ))}
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

/** Fila del menú: ícono en círculo tintado (como el botón de cerrar de los paneles) y texto. */
function OpcionMenu({ texto, icono, color, fondo, enfocar, onPress }: OpcionMenuFlotante & { enfocar?: boolean }) {
  const { colors, type, minTouchSize } = useTheme();
  const ref = useRef<ViewInstance>(null);
  // Al abrir con teclado el foco entra en la primera opción.
  useEffect(() => {
    if (enfocar) (ref.current as unknown as HTMLElement | null)?.focus?.();
  }, [enfocar]);
  return (
    <Pressable
      ref={ref}
      role="menuitem"
      onPress={onPress}
      style={({ pressed, hovered, focused }: { pressed: boolean; hovered?: boolean; focused?: boolean }) => [
        styles.opcion,
        { minHeight: minTouchSize + 4, backgroundColor: pressed || hovered || focused ? colors.primaryTint : 'transparent', opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.circulo, { backgroundColor: fondo }]}>
        <Ionicons name={icono} size={20} color={color} />
      </View>
      <Text style={[type.body, { color, fontFamily: fonts.bodyBold, flex: 1 }]} numberOfLines={2}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', padding: 8, gap: 2 },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 },
  circulo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
