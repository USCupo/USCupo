import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { OfertaCard } from '../../src/components/OfertaCard';
import { Cargando, ErrorCarga, EstadoVacio, Pantalla, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { useInicioController } from '../../src/controllers/useInicioController';
import { textoNotificacion } from '../../src/models/notificaciones';
import { diasRestantes, hace } from '../../src/models/ofertas';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';

export default function InicioScreen() {
  const c = useInicioController();
  const router = useRouter();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const dosColumnas = breakpoint === 'amplio';
  const d = c.datos;

  const irABuscar = (materiaId?: number) =>
    router.push(materiaId ? { pathname: '/buscar', params: { materia: String(materiaId) } } : '/buscar');

  return (
    <Pantalla
      titulo={`Hola, ${c.primerNombre}`}
      subtitulo={d?.carrera ?? 'Cambios de horario entre estudiantes USC'}
      acciones={
        dosColumnas ? (
          <View style={{ width: 200 }}>
            <Button label="Publicar un cupo" onPress={() => router.push('/publicar')} />
          </View>
        ) : null
      }
    >
      {c.cargando && !d ? (
        <Cargando sobreFondo texto="Cargando tu resumen…" />
      ) : c.error && !d ? (
        <ErrorCarga mensaje={c.error} onReintentar={c.recargar} />
      ) : d ? (
        <View style={[dosColumnas && styles.columnas, { gap: spacing.lg }]}>
          {/* Principal */}
          <View style={[dosColumnas && { flex: 2 }, { gap: spacing.lg }]}>
            {!d.hayMaterias ? (
              <Tarjeta>
                <EstadoVacio
                  icono="book-outline"
                  titulo="Tu programa aún no tiene materias cargadas"
                  texto="Estamos cargando los pénsums de cada carrera. Cuando el tuyo esté listo podrás publicar y buscar cambios."
                />
              </Tarjeta>
            ) : null}

            {d.porConfirmar.length > 0 ? (
              <Tarjeta style={{ borderColor: colors.accent, borderWidth: 1.5 }}>
                <TituloSeccion>Te están esperando</TituloSeccion>
                {d.porConfirmar.map((o) => (
                  <View key={o.id} style={[styles.filaAccion, { borderTopColor: colors.border, paddingVertical: spacing.sm + 2 }]}>
                    <View style={[styles.punto, { backgroundColor: colors.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.body, { color: colors.text }]}>
                        <Text style={{ fontFamily: 'Inter_700Bold' }}>{o.interesado?.nombre_completo ?? 'Un estudiante'}</Text> quiere tu
                        cupo de {o.materia.nombre}
                      </Text>
                      <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
                        Quedan {diasRestantes(o.expires_at)} días para confirmar
                      </Text>
                    </View>
                  </View>
                ))}
                <View style={{ marginTop: spacing.sm, alignSelf: dosColumnas ? 'flex-start' : 'stretch' }}>
                  <Button label="Ver contacto y confirmar" onPress={() => router.push('/mis-cambios')} />
                </View>
              </Tarjeta>
            ) : null}

            <View>
              <TituloSeccion sobreFondo accion={d.coincidencias.length ? <Enlace texto="Ver todas" onPress={() => irABuscar()} /> : undefined}>
                Coincidencias para ti
              </TituloSeccion>
              {d.coincidencias.length > 0 ? (
                <View style={[styles.rejilla, { gap: spacing.md }]}>
                  {d.coincidencias.slice(0, 4).map(({ oferta, mia }) => (
                    <View key={oferta.id} style={breakpoint === 'compacto' ? styles.celdaCompleta : styles.celdaMitad}>
                      <OfertaCard
                        oferta={oferta}
                        esMatch
                        resaltarTiene
                        miBloqueActualId={mia.bloque_actual_id}
                        pie={<Button label="Ver y marcar interés" variant="secondary" onPress={() => irABuscar(oferta.materia_id)} />}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Tarjeta>
                  <EstadoVacio
                    icono="swap-horizontal"
                    titulo={d.misActivas ? 'Aún no hay un cambio exacto para ti' : 'Publica tu cupo para encontrar coincidencias'}
                    texto={
                      d.misActivas
                        ? 'Te mostramos aquí a quien tenga el horario que buscas y busque el tuyo. Mientras tanto, revisa todas las ofertas.'
                        : 'Cuenta qué grupo tienes y qué horario buscas; te avisamos cuando alguien haga el cambio inverso.'
                    }
                    accion={
                      d.misActivas
                        ? { label: 'Buscar ofertas', onPress: () => irABuscar() }
                        : { label: 'Publicar un cupo', onPress: () => router.push('/publicar') }
                    }
                  />
                </Tarjeta>
              )}
            </View>

            {d.recientes.length > 0 ? (
              <View>
                <TituloSeccion sobreFondo accion={<Enlace texto="Buscar" onPress={() => irABuscar()} />}>
                  Recién publicadas en tu carrera
                </TituloSeccion>
                <View style={[styles.rejilla, { gap: spacing.md }]}>
                  {d.recientes.map((o) => (
                    <View key={o.id} style={breakpoint === 'compacto' ? styles.celdaCompleta : styles.celdaMitad}>
                      <OfertaCard oferta={o} pie={<Button label="Ver en Buscar" variant="secondary" onPress={() => irABuscar(o.materia_id)} />} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Lateral */}
          <View style={[dosColumnas && { flex: 1 }, { gap: spacing.lg }]}>
            <Tarjeta>
              <TituloSeccion>Avisos</TituloSeccion>
              {d.avisos.length === 0 ? (
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
                  Aquí verás cuando alguien quiera tu cupo o se confirme un cambio.
                </Text>
              ) : (
                d.avisos.map((a) => (
                  <Pressable
                    key={a.id}
                    accessibilityRole="button"
                    onPress={() => router.push('/mis-cambios')}
                    style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
                      styles.aviso,
                      { borderTopColor: colors.border, paddingVertical: spacing.sm + 2, backgroundColor: hovered ? colors.primaryTint : 'transparent' },
                    ]}
                  >
                    <Ionicons
                      name={a.tipo === 'interes_recibido' ? 'hand-right-outline' : a.tipo === 'cambio_confirmado' ? 'checkmark-done' : 'time-outline'}
                      size={18}
                      color={a.leida ? colors.textMuted : colors.accentText}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: a.leida ? 'Inter_400Regular' : 'Inter_700Bold' }]}>
                        {textoNotificacion(a)}
                      </Text>
                      <Text style={[type.bodyMuted, { color: colors.textMuted, fontSize: 12 }]}>{hace(a.created_at)}</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </Tarjeta>

            <Tarjeta>
              <TituloSeccion>Cómo funciona</TituloSeccion>
              {[
                'Publica el grupo que tienes y los horarios que te sirven.',
                'Cuando alguien marca interés, ambos ven el contacto del otro durante 7 días.',
                'Hagan el cambio en los canales oficiales de la USC y confírmalo aquí.',
              ].map((paso, i) => (
                <View key={paso} style={[styles.paso, { marginTop: i ? spacing.sm : 0 }]}>
                  <Text style={[type.bodyMuted, { color: colors.accentText, fontFamily: 'Inter_700Bold', width: 16 }]}>{i + 1}</Text>
                  <Text style={[type.bodyMuted, { color: colors.textMuted, flex: 1 }]}>{paso}</Text>
                </View>
              ))}
            </Tarjeta>
          </View>
        </View>
      ) : null}
    </Pantalla>
  );
}

function Enlace({ texto, onPress }: { texto: string; onPress: () => void }) {
  const { colors, type } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text style={[type.bodyMuted, { color: colors.accent, fontFamily: 'Inter_700Bold' }]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaCompleta: { width: '100%' },
  celdaMitad: { flexBasis: '47%', flexGrow: 1, minWidth: 280 },
  filaAccion: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  punto: { width: 8, height: 8, borderRadius: 4 },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 4 },
  paso: { flexDirection: 'row', gap: 8 },
});
