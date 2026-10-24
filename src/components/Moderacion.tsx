import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { ModeracionController } from '../controllers/useModeracionController';
import { MAX_DETALLE, MOTIVOS_REPORTE } from '../controllers/estadoModeracion';
import type { OfertaDetalle } from '../models/ofertas';
import { conAlfa } from '../theme/glass';
import { useTheme } from '../theme/useTheme';
import { MenuFlotante, type OpcionMenuFlotante } from './MenuFlotante';
import { OpcionLista } from './SelectorLista';
import { TextField } from './TextField';
import { Aviso, DialogoConfirmar } from './ui';

/**
 * Menú "⋮" de una tarjeta ajena (Moderacion.kt de Android): reportar la oferta y bloquear a quien
 * la publicó. Sin `onReportar` solo ofrece bloquear (p. ej. al interesado en mi propia oferta).
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
  const opciones: OpcionMenuFlotante[] = [
    ...(onReportar ? [{ texto: 'Reportar oferta', icono: 'flag-outline' as const, color: colors.link, fondo: colors.primaryTint, onPress: onReportar }] : []),
    { texto: `Bloquear a ${nombre}`, icono: 'ban-outline', color: colors.danger, fondo: conAlfa(colors.danger, 0.14), onPress: onBloquear },
  ];
  return (
    <MenuFlotante
      etiquetaBoton="Más opciones"
      etiquetaMenu={etiqueta}
      opciones={opciones}
      estiloBoton={({ pressed, hovered }) => [
        styles.disparador,
        { width: minTouchSize, height: minTouchSize, backgroundColor: pressed || hovered ? colors.primaryTint : 'transparent' },
      ]}
    >
      <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
    </MenuFlotante>
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
});
