import Ionicons from './Iconos';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { ContactoRevelado } from '../models/types';
import { useTheme } from '../theme/useTheme';
import { fonts } from '../theme/typography';

// Datos de contacto del otro estudiante (solo llegan si hay interés activo entre ambos).
export function Contacto({ contacto, materia }: { contacto: ContactoRevelado | null | undefined; materia: string }) {
  const { colors, spacing, type, radius } = useTheme();

  if (!contacto) {
    return <Text style={[type.bodyMuted, { color: colors.textMuted }]}>No pudimos cargar el contacto. Recarga la página.</Text>;
  }

  const mensaje = encodeURIComponent(`Hola ${contacto.nombre_completo.split(' ')[0]}, te escribo por USCupo por el cambio de ${materia}.`);
  const wa = contacto.whatsapp?.replace(/\D/g, '');

  return (
    <View style={[styles.caja, { backgroundColor: colors.primaryTint, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm }]}>
      <Text style={[type.body, { color: colors.text, fontFamily: fonts.bodyBold }]}>{contacto.nombre_completo}</Text>
      {contacto.correo ? (
        <Enlace icono="mail-outline" texto={contacto.correo} url={`mailto:${contacto.correo}?subject=${encodeURIComponent('Cambio de horario · USCupo')}&body=${mensaje}`} />
      ) : null}
      {wa ? <Enlace icono="logo-whatsapp" texto={contacto.whatsapp!} url={`https://wa.me/${wa}?text=${mensaje}`} /> : null}
      {!contacto.correo && !wa ? (
        <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Este estudiante ocultó sus datos de contacto.</Text>
      ) : null}
    </View>
  );
}

function Enlace({ icono, texto, url }: { icono: 'mail-outline' | 'logo-whatsapp'; texto: string; url: string }) {
  const { colors, type } = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={icono === 'mail-outline' ? `Escribir a ${texto}` : `Abrir WhatsApp con ${texto}`}
      onPress={() => Linking.openURL(url)}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [styles.enlace, { opacity: pressed ? 0.7 : 1 }, hovered ? { transform: [{ translateX: 2 }] } : null]}
    >
      <Ionicons name={icono} size={18} color={colors.link} />
      <Text style={[type.body, { color: colors.link, fontFamily: fonts.bodyBold, flexShrink: 1 }]} numberOfLines={1}>
        {texto}
      </Text>
    </Pressable>
  );
}

export function Interruptor({ label, descripcion, valor, onCambiar }: { label: string; descripcion?: string; valor: boolean; onCambiar: (v: boolean) => void }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.interruptor, { paddingVertical: spacing.sm }]}>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: colors.text }]}>{label}</Text>
        {descripcion ? <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{descripcion}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={valor}
        onValueChange={onCambiar}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
        {...({ activeThumbColor: '#FFFFFF' } as object)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {},
  enlace: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 32 },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
