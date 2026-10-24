import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ModeracionController } from '../controllers/useModeracionController';
import { MAX_DETALLE, MOTIVOS_REPORTE } from '../controllers/estadoModeracion';
import type { OfertaDetalle } from '../models/ofertas';
import { conAlfa, cristalClaro } from '../theme/glass';
import { animarResorte, resorte, useReducedMotion } from '../theme/motion';
import { useTheme } from '../theme/useTheme';
import { OpcionLista } from './SelectorLista';
import { TextField } from './TextField';
import { Aviso, DialogoConfirmar } from './ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ANCHO_MENU = 240;
const RADIO_MENU = 32;

/**
 * Menú "⋮" de una tarjeta ajena (Moderacion.kt de Android): reportar la oferta y bloquear a quien
 * la publicó. Sin `onReportar` solo ofrece bloquear (p. ej. al interesado en mi propia oferta).
 * Va en un Modal para que ninguna tarjeta vecina lo tape; Escape y el clic fuera lo cierran.
 */
export function MenuModeracion({
  nombre,
  onBloquear,
  onReportar,
  etiqueta = `Opciones de la oferta de ${nombre}`,
}: {
  nombre: string;
  onBloquear: () => void;
  onReportar?: () => void;
  /** Nombre accesible del menú; en mi propia oferta no es "la oferta de" quien se nombra. */
  etiqueta?: string;
}) {
  const { colors, minTouchSize } = useTheme();
  const { width, height } = useWindowDimensions();
  const reducir = useReducedMotion();
  const boton = useRef<View>(null);
  const entrada = useRef(new Animated.Value(0)).current;
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  const abrir = () => {
    boton.current?.measureInWindow((x, y, w, h) => {
      const filas = onReportar ? 2 : 1;
      const alto = filas * (minTouchSize + 4) + 16;
      const right = Math.max(8, width - (x + w));
      // Cerca del borde inferior (dock del teléfono) se abre hacia arriba.
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
        accessibilityLabel="Más opciones"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onPress={abrir}
        style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.disparador,
          { width: minTouchSize, height: minTouchSize, backgroundColor: pressed || hovered ? colors.primaryTint : 'transparent' },
        ]}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
      </Pressable>

      <Modal visible={!!pos} transparent animationType="none" onRequestClose={cerrar}>
        <Pressable accessibilityLabel="Cerrar menú" onPress={cerrar} style={StyleSheet.absoluteFill} />
        {pos ? (
          <Animated.View
            role="menu"
            accessibilityLabel={etiqueta}
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
            {onReportar ? (
              <OpcionMenu texto="Reportar oferta" icono="flag-outline" color={colors.link} fondo={colors.primaryTint} enfocar onPress={() => elegir(onReportar)} />
            ) : null}
            <OpcionMenu
              texto={`Bloquear a ${nombre}`}
              icono="ban-outline"
              color={colors.danger}
              fondo={conAlfa(colors.danger, 0.14)}
              enfocar={!onReportar}
              onPress={() => elegir(onBloquear)}
            />
          </Animated.View>
        ) : null}
      </Modal>
    </>
  );
}

/** Fila del menú: ícono en círculo tintado (como el botón de cerrar de los paneles) y texto. */
function OpcionMenu({ texto, icono, color, fondo, enfocar, onPress }: { texto: string; icono: IconName; color: string; fondo: string; enfocar?: boolean; onPress: () => void }) {
  const { colors, type, minTouchSize } = useTheme();
  const ref = useRef<View>(null);
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
      <Text style={[type.body, { color, fontFamily: 'Inter_700Bold', flex: 1 }]} numberOfLines={2}>
        {texto}
      </Text>
    </Pressable>
  );
}

/** Menú de una oferta ajena: reportarla o bloquear a quien la publicó. */
export function MenuDeOferta({ oferta, moderacion }: { oferta: OfertaDetalle; moderacion: ModeracionController }) {
  const nombre = oferta.dueno?.nombre_completo ?? 'este estudiante';
  return (
    <MenuModeracion
      nombre={nombre}
      onReportar={() => moderacion.pedirReporte(oferta)}
      onBloquear={() => moderacion.pedirBloqueo(oferta.user_id, nombre)}
    />
  );
}

/**
 * Diálogo de reporte o de bloqueo (el que esté abierto) y el aviso de resultado. Las pantallas
 * que ya tienen su propio <Aviso> pasan `conAviso={false}` y muestran ahí `estado.aviso`, para
 * que no se apilen dos avisos en el mismo sitio.
 */
export function DialogosModeracion({ moderacion: m, conAviso = true }: { moderacion: ModeracionController; conAviso?: boolean }) {
  const s = m.estado;
  return (
    <>
      <DialogoConfirmar
        visible={!!s.reportando}
        titulo="Reportar oferta"
        mensaje={`Cuéntanos qué pasa con esta oferta de ${s.reportando?.materia.nombre ?? ''}. Quien la publicó no sabrá que la reportaste.`}
        confirmar="Enviar reporte"
        cargando={s.enviando}
        error={s.error}
        confirmarDeshabilitado={!s.motivo}
        onConfirmar={m.confirmar}
        onCancelar={m.cancelar}
      >
        <View role="radiogroup" accessibilityLabel="Motivo del reporte">
          {MOTIVOS_REPORTE.map((mo) => (
            <OpcionLista key={mo.clave} titulo={mo.etiqueta} activa={s.motivo === mo.clave} onPress={() => m.elegirMotivo(mo.clave)} />
          ))}
        </View>
        <TextField
          label="Detalle (opcional)"
          placeholder="Qué viste"
          value={s.detalle}
          onChangeText={m.setDetalle}
          multiline
          numberOfLines={3}
          maxLength={MAX_DETALLE}
          editable={!s.enviando}
          style={{ minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }}
        />
      </DialogoConfirmar>
      <DialogoConfirmar
        visible={!!s.bloqueando}
        titulo={`¿Bloquear a ${s.bloqueando?.nombre ?? ''}?`}
        mensaje="No verán las ofertas del otro ni podrán marcar interés entre ustedes. Si tenían un cambio en curso, se cancela. No le avisaremos. Puedes desbloquear desde Perfil."
        confirmar="Bloquear"
        peligroso
        cargando={s.enviando}
        error={s.error}
        onConfirmar={m.confirmar}
        onCancelar={m.cancelar}
      />
      {conAviso ? <Aviso mensaje={s.aviso} onCerrar={m.cerrarAviso} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  disparador: { alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  panel: { position: 'absolute', padding: 8, gap: 2 },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 },
  circulo: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
