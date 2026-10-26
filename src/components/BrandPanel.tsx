import { StyleSheet, Text, View } from 'react-native';
import { USC_EMAIL_DOMAIN } from '../lib/supabase';
import { DESCRIPCION_PRODUCTO, LEMA, PASOS } from '../models/informacion';
import { useTheme } from '../theme/useTheme';
import { LogoCompleto } from './Logo';
import { fonts } from '../theme/typography';


// Panel de marca para pantallas anchas, directamente sobre el degradado institucional:
// explica en tres pasos qué hace USCupo. `bajo`: ventana de poca altura (portátil pequeño);
// todo se reduce para que quepa entero sin montarse. `descripcion`: añade el párrafo de qué es
// USCupo (inicio sin sesión, que también leen buscadores y agentes).
export function BrandPanel({ bajo = false, descripcion = false }: { bajo?: boolean; descripcion?: boolean }) {
  const { colors, spacing, type } = useTheme();
  const aire = bajo ? spacing.lg : spacing.xl;

  return (
    <View style={[styles.panel, { padding: bajo ? spacing.xl : spacing.xxl }]}>
      <View style={styles.bloque}>
        {/* Logo centrado justo encima del titular. */}
        <View style={{ alignItems: 'center', marginBottom: aire }}>
          <LogoCompleto width={bajo ? 104 : 148} sobre="azul" />
        </View>
        <Text role="heading" aria-level={1} style={[styles.titular, bajo && styles.titularBajo, { color: colors.onBackground, textAlign: 'center' }]}>
          {LEMA}
        </Text>
        {descripcion ? (
          <Text style={[type.body, { color: colors.onBackgroundMuted, textAlign: 'center', marginTop: aire }]}>{DESCRIPCION_PRODUCTO}</Text>
        ) : null}

        <View style={{ marginTop: aire }}>
          {PASOS.map((paso, i) => (
            <View
              key={paso}
              style={[styles.paso, { borderTopColor: colors.onBackgroundBorder, paddingVertical: bajo ? spacing.sm : spacing.md }]}
            >
              <View style={[styles.numero, { borderColor: colors.accent }]}>
                <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 14 }}>{i + 1}</Text>
              </View>
              <Text style={[type.body, { color: colors.onBackgroundMuted, flex: 1 }]}>{paso}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, alignSelf: 'flex-start', marginTop: aire }]}>
        Exclusivo para estudiantes con correo <Text style={{ color: colors.accent }}>@{USC_EMAIL_DOMAIN}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // El bloque ocupa el alto libre y se centra en él; el pie va debajo en el flujo, así en
  // ventanas bajas empuja en vez de montarse sobre la lista.
  panel: {
    flex: 1,
    alignItems: 'center',
  },
  bloque: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
  },
  titular: {
    fontFamily: fonts.heading,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  titularBajo: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.6,
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
