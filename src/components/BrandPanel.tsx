import { StyleSheet, Text, View } from 'react-native';
import { USC_EMAIL_DOMAIN } from '../lib/supabase';
import { useTheme } from '../theme/useTheme';
import { LogoCompleto } from './Logo';

const PASOS = [
  'Publicas el grupo que tienes y el horario que buscas.',
  'Otro estudiante muestra interés y ambos ven sus datos de contacto.',
  'Hacen el cambio por los canales oficiales de la USC.',
];

// Panel de marca para pantallas anchas, directamente sobre el degradado institucional:
// explica en tres pasos qué hace USCupo.
export function BrandPanel() {
  const { colors, spacing, type } = useTheme();

  return (
    <View style={[styles.panel, { padding: spacing.xxl }]}>
      <LogoCompleto width={92} sobre="azul" />

      <View style={{ maxWidth: 480 }}>
        <Text accessibilityRole="header" style={[styles.titular, { color: colors.onBackground }]}>
          Encuentra a alguien que quiera tu horario y te dé el suyo.
        </Text>

        <View style={{ marginTop: spacing.xl }}>
          {PASOS.map((paso, i) => (
            <View
              key={paso}
              style={[styles.paso, { borderTopColor: colors.onBackgroundBorder, paddingVertical: spacing.md }]}
            >
              <View style={[styles.numero, { borderColor: colors.accent }]}>
                <Text style={{ color: colors.accent, fontFamily: 'Inter_700Bold', fontSize: 14 }}>{i + 1}</Text>
              </View>
              <Text style={[type.body, { color: colors.onBackgroundMuted, flex: 1 }]}>{paso}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted }]}>
        Exclusivo para estudiantes con correo <Text style={{ color: colors.accent }}>@{USC_EMAIL_DOMAIN}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titular: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  paso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
