import Ionicons from './Iconos';
import { useEffect, useState } from 'react';
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
  // Nombre de usuario de WhatsApp (empieza por @) o número; con usuario no hay enlace directo.
  const usuarioWa = contacto.whatsapp?.trim().startsWith('@') ? contacto.whatsapp.trim() : null;
  const wa = usuarioWa ? '' : contacto.whatsapp?.replace(/\D/g, '');

  return (
    <View style={[styles.caja, { backgroundColor: colors.primaryTint, borderRadius: radius.card, padding: spacing.md, gap: spacing.sm }]}>
      <Text style={[type.body, { color: colors.text, fontFamily: fonts.bodyBold }]}>{contacto.nombre_completo}</Text>
      {contacto.correo ? (
        <Enlace icono="mail-outline" texto={contacto.correo} url={`mailto:${contacto.correo}?subject=${encodeURIComponent('Cambio de horario · USCupo')}&body=${mensaje}`} />
      ) : null}
      {wa ? <Enlace icono="logo-whatsapp" texto={contacto.whatsapp!} url={`https://wa.me/${wa}?text=${mensaje}`} /> : null}
      {usuarioWa ? <UsuarioWhatsapp usuario={usuarioWa} /> : null}
      {!contacto.correo && !wa && !usuarioWa ? (
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

// Usuario de WhatsApp: se copia y se busca en la app (WhatsApp no publica un enlace directo para usuarios).
function UsuarioWhatsapp({ usuario }: { usuario: string }) {
  const { colors, type, radius } = useTheme();
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(usuario);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles: el usuario sigue visible para copiarlo a mano.
    }
  };

  return (
    <View style={{ gap: 2 }}>
      <View style={styles.enlace}>
        <Ionicons name="logo-whatsapp" size={18} color={colors.link} />
        <Text selectable style={[type.body, { color: colors.text, fontFamily: fonts.bodyBold, flexShrink: 1 }]} numberOfLines={1}>
          {usuario}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copiado ? 'Usuario copiado' : `Copiar ${usuario}`}
          onPress={copiar}
          hitSlop={6}
          style={({ pressed }) => [styles.copiar, { borderColor: colors.link, borderRadius: radius.control, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[type.bodyMuted, { color: colors.link, fontFamily: fonts.bodyBold }]}>{copiado ? 'Copiado' : 'Copiar'}</Text>
        </Pressable>
      </View>
      <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Búscalo en WhatsApp para escribirle.</Text>
    </View>
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
  copiar: { borderWidth: 1, paddingHorizontal: 12, minHeight: 32, justifyContent: 'center' },
});
