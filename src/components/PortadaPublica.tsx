import { Link, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { USC_EMAIL_DOMAIN } from '../lib/supabase';
import { CONSEJOS, DESCRIPCION_PRODUCTO, LEMA, PASOS, PREGUNTAS, VENTAJAS } from '../models/informacion';
import { AVISO_NO_OFICIAL } from '../models/legal';
import { cristalClaro, cristalOscuro, glass } from '../theme/glass';
import { fonts } from '../theme/typography';
import { useBreakpoint } from '../theme/useBreakpoint';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { FooterWeb } from './FooterWeb';
import { GradientBackground } from './GradientBackground';
import { Logo } from './Logo';
import { PieLegal } from './PieLegal';
import { ThemeToggle } from './ThemeToggle';

// react-native-web pasa dataSet como atributos data-*; los tipos de React Native no lo declaran.
const ENTRADA = { dataSet: { entrada: '' } } as object;

// En la portada van las primeras; el resto está en /preguntas.
const PREGUNTAS_PORTADA = 6;

// Portada para quien llega sin sesión (y lo que leen buscadores, agentes y la revisión de AdSense):
// qué es USCupo, cómo funciona, por qué usarlo, preguntas frecuentes y consejos. Sin anuncios.
export function PortadaPublica() {
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const compacto = breakpoint === 'compacto';
  const amplio = breakpoint === 'amplio';

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: compacto ? spacing.md : spacing.xl,
          alignItems: 'center',
        }}
      >
        <View style={styles.columna}>
          {/* Barra: marca a la izquierda; tema e ingreso a la derecha. */}
          <View style={[styles.barra, cristalOscuro(colors), { paddingLeft: spacing.md, paddingRight: spacing.xs }]}>
            <View style={[styles.fila, { gap: spacing.sm }]}>
              <Logo size={32} sobre="azul" />
              <Text style={[type.sectionTitle, { color: colors.onBackground }]}>
                USC<Text style={{ color: colors.accent }}>upo</Text>
              </Text>
            </View>
            <View style={[styles.fila, { gap: spacing.xs }]}>
              <ThemeToggle />
              <Link href="/login?modo=ingreso" style={[styles.pildora, { color: colors.onBackground, fontFamily: fonts.bodyBold }]}>
                Iniciar sesión
              </Link>
            </View>
          </View>

          {/* Portada */}
          <View {...ENTRADA} style={[styles.heroe, { paddingVertical: compacto ? spacing.xl : spacing.xxl * 1.5 }]}>
            <Text style={[type.bodyMuted, styles.antetitulo, { color: colors.accent }]}>
              Cambios de horario entre estudiantes USC
            </Text>
            <Text
              role="heading"
              aria-level={1}
              style={[styles.titular, compacto && styles.titularCompacto, { color: colors.onBackground }]}
            >
              {LEMA}
            </Text>
            <Text style={[type.body, styles.bajada, { color: colors.onBackgroundMuted, marginTop: spacing.lg }]}>
              {DESCRIPCION_PRODUCTO}
            </Text>
            <View style={[styles.acciones, compacto && styles.accionesCompacto, { marginTop: spacing.xl, gap: spacing.sm }]}>
              <Button label="Crear cuenta gratis" onPress={() => router.push('/login')} style={styles.boton} />
              <Button label="Ya tengo cuenta" variant="secondary" onPress={() => router.push('/login?modo=ingreso')} style={styles.boton} />
            </View>
            <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, marginTop: spacing.md, textAlign: 'center' }]}>
              Exclusivo para estudiantes con correo <Text style={{ color: colors.accent }}>@{USC_EMAIL_DOMAIN}</Text>
            </Text>
          </View>

          <Seccion titulo="Cómo funciona">
            <View style={[styles.rejilla, { gap: spacing.md }]}>
              {PASOS.map((paso, i) => (
                <View
                  key={paso}
                  style={[styles.celda, amplio ? styles.tercio : compacto ? null : styles.mitad, cristalOscuro(colors), { padding: spacing.lg }]}
                >
                  <View style={[styles.numero, { borderColor: colors.accent }]}>
                    <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 14 }}>{i + 1}</Text>
                  </View>
                  <Text style={[type.body, { color: colors.onBackground, marginTop: spacing.md }]}>{paso}</Text>
                </View>
              ))}
            </View>
          </Seccion>

          <Seccion titulo="Por qué USCupo">
            <View style={[styles.rejilla, { gap: spacing.md }]}>
              {VENTAJAS.map((v) => (
                <View key={v.titulo} style={[styles.celda, compacto ? null : styles.mitad, cristalClaro(colors), { padding: spacing.lg }]}>
                  <Text role="heading" aria-level={3} style={[type.cardTitle, { color: colors.text }]}>
                    {v.titulo}
                  </Text>
                  <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.xs }]}>{v.texto}</Text>
                </View>
              ))}
            </View>
          </Seccion>

          <Seccion titulo="Preguntas frecuentes">
            <View style={[cristalClaro(colors), styles.panel, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
              {PREGUNTAS.slice(0, PREGUNTAS_PORTADA).map((p, i) => (
                <View
                  key={p.pregunta}
                  style={[{ paddingVertical: spacing.md }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                >
                  <Text role="heading" aria-level={3} style={[type.cardTitle, { color: colors.text }]}>
                    {p.pregunta}
                  </Text>
                  <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.xs }]}>{p.respuesta}</Text>
                </View>
              ))}
            </View>
            <Link href="/preguntas" style={[type.body, styles.enlace, { color: colors.onBackground, marginTop: spacing.md }]}>
              Ver todas las preguntas
            </Link>
          </Seccion>

          <Seccion titulo="Consejos para un cambio seguro">
            <View style={[cristalOscuro(colors), styles.panel, { padding: spacing.lg, gap: spacing.md }]}>
              {CONSEJOS.map((c) => (
                <View key={c} style={[styles.fila, styles.consejo, { gap: spacing.sm }]}>
                  <View style={[styles.punto, { backgroundColor: colors.accent }]} />
                  <Text style={[type.body, { color: colors.onBackground, flex: 1 }]}>{c}</Text>
                </View>
              ))}
            </View>
          </Seccion>

          {/* Cierre */}
          <View style={[cristalClaro(colors), styles.panel, styles.cierre, { padding: compacto ? spacing.lg : spacing.xl, marginTop: spacing.xxl }]}>
            <Text role="heading" aria-level={2} style={[type.screenTitle, { color: colors.text, textAlign: 'center' }]}>
              ¿Necesitas otro horario?
            </Text>
            <Text style={[type.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }]}>
              Publica tu cupo en un minuto y te avisamos cuando alguien quiera cambiar contigo.
            </Text>
            <View style={[styles.acciones, compacto && styles.accionesCompacto, { marginTop: spacing.lg, gap: spacing.sm }]}>
              <Button label="Crear cuenta gratis" onPress={() => router.push('/login')} style={styles.boton} />
            </View>
          </View>

          {compacto ? (
            <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
              <PieLegal sobreOscuro />
              <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, textAlign: 'center', marginTop: spacing.sm }]}>
                {AVISO_NO_OFICIAL}
              </Text>
            </View>
          ) : (
            <FooterWeb style={{ marginTop: spacing.xxl }} />
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text role="heading" aria-level={2} style={[type.screenTitle, { color: colors.onBackground, marginBottom: spacing.lg }]}>
        {titulo}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  columna: { width: '100%', maxWidth: 1080 },
  fila: { flexDirection: 'row', alignItems: 'center' },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: glass.pill,
    minHeight: 56,
  },
  pildora: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 },
  heroe: { alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 760 },
  antetitulo: { fontFamily: fonts.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase', fontSize: 12, textAlign: 'center' },
  titular: {
    fontFamily: fonts.heading,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 12,
  },
  titularCompacto: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  bajada: { textAlign: 'center', maxWidth: 620 },
  acciones: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  accionesCompacto: { flexDirection: 'column', alignSelf: 'stretch' },
  boton: { minWidth: 200, paddingHorizontal: 24 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { borderRadius: glass.panel, flexGrow: 1, flexBasis: '100%' },
  mitad: { flexBasis: '45%' },
  tercio: { flexBasis: '30%' },
  numero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: { borderRadius: glass.panel },
  consejo: { alignItems: 'flex-start' },
  punto: { width: 8, height: 8, borderRadius: 4, marginTop: 8 },
  enlace: { textDecorationLine: 'underline', alignSelf: 'flex-start', paddingVertical: 8, fontFamily: fonts.bodyBold },
  cierre: { alignItems: 'center' },
});
