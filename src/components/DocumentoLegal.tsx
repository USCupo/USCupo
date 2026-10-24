import Head from 'expo-router/head';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RESPONSABLE, VIGENTE_DESDE, type Bloque, type Documento } from '../models/legal';
import { useTheme } from '../theme/useTheme';
import { GradientBackground } from './GradientBackground';
import { Logo } from './Logo';

// Página pública (sin sesión) para documentos legales. Google Play y quien no tenga la app la enlazan.
export function DocumentoLegal({ doc }: { doc: Documento }) {
  const { colors, spacing, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const parrafo = (b: Bloque, i: number) =>
    typeof b === 'string' ? (
      <Text key={i} style={[type.body, styles.parrafo, { color: colors.text }]}>
        {b}
      </Text>
    ) : (
      <View key={i} style={styles.lista}>
        {b.lista.map((item) => (
          <View key={item} style={styles.item}>
            <Text style={[type.body, { color: colors.textMuted }]}>•</Text>
            <Text style={[type.body, styles.textoItem, { color: colors.text }]}>{item}</Text>
          </View>
        ))}
      </View>
    );

  return (
    <GradientBackground>
      <Head>
        <title>{`${doc.titulo} · USCupo`}</title>
        <meta name="description" content={doc.resumen} />
      </Head>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingHorizontal: spacing.md,
          alignItems: 'center',
        }}
      >
        <View style={styles.columna}>
          <Link href="/" accessibilityLabel="Ir a USCupo" style={styles.marca}>
            <View style={styles.filaMarca}>
              <Logo size={36} sobre="azul" />
              <Text style={[type.sectionTitle, { color: colors.onBackground, marginLeft: spacing.sm }]}>USCupo</Text>
            </View>
          </Link>
          <View
            style={[
              styles.tarjeta,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.card, padding: spacing.lg },
            ]}
          >
            <Text accessibilityRole="header" style={[type.screenTitle, { color: colors.text }]}>
              {doc.titulo}
            </Text>
            <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.xs }]}>
              {doc.resumen} Vigente desde el {VIGENTE_DESDE}.
            </Text>
            {doc.secciones.map((s) => (
              <View key={s.titulo} style={{ marginTop: spacing.lg }}>
                <Text accessibilityRole="header" style={[type.cardTitle, { color: colors.text, marginBottom: spacing.xs }]}>
                  {s.titulo}
                </Text>
                {s.bloques.map(parrafo)}
              </View>
            ))}
          </View>
          <View style={[styles.pie, { marginTop: spacing.lg }]}>
            <Link href="/terminos" style={[type.bodyMuted, styles.enlace, { color: colors.onBackground }]}>
              Términos de uso
            </Link>
            <Link href="/privacidad" style={[type.bodyMuted, styles.enlace, { color: colors.onBackground }]}>
              Privacidad
            </Link>
            <Link href="/eliminar-cuenta" style={[type.bodyMuted, styles.enlace, { color: colors.onBackground }]}>
              Eliminar cuenta
            </Link>
          </View>
          <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, textAlign: 'center', marginTop: spacing.sm }]}>
            Contacto: {RESPONSABLE.correo}
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  columna: { width: '100%', maxWidth: 760 },
  marca: { alignSelf: 'flex-start', marginBottom: 16 },
  filaMarca: { flexDirection: 'row', alignItems: 'center' },
  tarjeta: { borderWidth: 1 },
  parrafo: { marginTop: 6 },
  lista: { marginTop: 6, gap: 6 },
  item: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  textoItem: { flex: 1 },
  pie: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  enlace: { textDecorationLine: 'underline', paddingVertical: 10 },
});
