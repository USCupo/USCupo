import Ionicons from '../../src/components/Iconos';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { EspacioAnuncio } from '../../src/components/EspacioAnuncio';
import { EsqueletoInicio } from '../../src/components/Esqueleto';
import { DialogosModeracion, MenuDeOferta } from '../../src/components/Moderacion';
import { OfertaCard } from '../../src/components/OfertaCard';
import { useModeracionController, type ModeracionController } from '../../src/controllers/useModeracionController';
import { Chip, ErrorCarga, EstadoVacio, Pantalla, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { useInicioController } from '../../src/controllers/useInicioController';
import { textoNotificacion } from '../../src/models/notificaciones';
import { diasRestantes, hace, type OfertaDetalle } from '../../src/models/ofertas';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';

export default function InicioScreen() {
  const c = useInicioController();
  const moderacion = useModeracionController(c.recargar);
  const router = useRouter();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const dosColumnas = breakpoint === 'amplio';
  const d = c.datos;
  // AdSense no admite anuncios en pantallas sin contenido: solo con ofertas que mostrar.
  const conContenido = !!d && (d.coincidencias.length > 0 || d.ofertasCarrera.length > 0);

  const irABuscar = (materiaId?: number) =>
    router.push(materiaId ? { pathname: '/buscar', params: { materia: String(materiaId) } } : '/buscar');

  return (
    <>
    <Pantalla
      tituloPagina="Inicio"
      prefijoTitulo="Hola, "
      titulo={c.primerNombre}
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
        <EsqueletoInicio />
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
                        <Text style={{ fontFamily: fonts.bodyBold }}>{o.interesado?.nombre_completo ?? 'Un estudiante'}</Text> quiere tu
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
                        menu={<MenuDeOferta oferta={oferta} moderacion={moderacion} />}
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

            <OfertasCarrera ofertas={d.ofertasCarrera} hayMaterias={d.hayMaterias} irABuscar={irABuscar} moderacion={moderacion} />

            {!dosColumnas && conContenido ? <EspacioAnuncio slot={process.env.EXPO_PUBLIC_ADSENSE_SLOT_INICIO} /> : null}
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
                      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: a.leida ? fonts.body : fonts.bodyBold }]}>
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
                  <Text style={[type.bodyMuted, { color: colors.accentText, fontFamily: fonts.bodyBold, width: 16 }]}>{i + 1}</Text>
                  <Text style={[type.bodyMuted, { color: colors.textMuted, flex: 1 }]}>{paso}</Text>
                </View>
              ))}
            </Tarjeta>

            {dosColumnas && conContenido ? <EspacioAnuncio slot={process.env.EXPO_PUBLIC_ADSENSE_SLOT_INICIO} alto={250} /> : null}
          </View>
        </View>
      ) : null}
    </Pantalla>
    <DialogosModeracion moderacion={moderacion} />
    </>
  );
}

const POR_PAGINA = 8;

// Todas las ofertas disponibles en las materias de la carrera del estudiante (nunca de otra
// carrera), con un filtro rápido por materia.
function OfertasCarrera({
  ofertas,
  hayMaterias,
  irABuscar,
  moderacion,
}: {
  ofertas: OfertaDetalle[];
  hayMaterias: boolean;
  irABuscar: (materiaId?: number) => void;
  moderacion: ModeracionController;
}) {
  const { spacing } = useTheme();
  const [materiaId, setMateriaId] = useState<number | null>(null);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const materias = useMemo(() => {
    const m = new Map<number, { nombre: string; n: number }>();
    for (const o of ofertas) m.set(o.materia_id, { nombre: o.materia.nombre, n: (m.get(o.materia_id)?.n ?? 0) + 1 });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [ofertas]);

  const filtradas = materiaId === null ? ofertas : ofertas.filter((o) => o.materia_id === materiaId);
  const elegir = (id: number | null) => {
    setMateriaId(id);
    setVisibles(POR_PAGINA);
  };

  if (!hayMaterias) return null;

  return (
    <View>
      <TituloSeccion sobreFondo accion={<Enlace texto="Buscar" onPress={() => irABuscar()} />}>
        {ofertas.length ? `Ofertas en tu carrera (${ofertas.length})` : 'Ofertas en tu carrera'}
      </TituloSeccion>

      {ofertas.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono="albums-outline"
            titulo="Nadie de tu carrera ha publicado todavía"
            texto="Cuando un compañero publique un cupo de tus materias aparecerá aquí."
          />
        </Tarjeta>
      ) : (
        <>
          {materias.length > 1 ? (
            <View style={[styles.filtros, { marginBottom: spacing.md }]}>
              <Chip texto="Todas" activo={materiaId === null} onPress={() => elegir(null)} />
              {materias.map(([id, m]) => (
                <Chip key={id} texto={`${m.nombre} · ${m.n}`} activo={materiaId === id} onPress={() => elegir(id)} />
              ))}
            </View>
          ) : null}

          {/* Una oferta por fila, a todo el ancho: en rejilla se veían amontonadas. */}
          <View style={{ gap: spacing.md }}>
            {filtradas.slice(0, visibles).map((o) => (
              <OfertaCard key={o.id} oferta={o} menu={<MenuDeOferta oferta={o} moderacion={moderacion} />} pie={<Button label="Ver en Buscar" variant="secondary" onPress={() => irABuscar(o.materia_id)} />} />
            ))}
          </View>

          {filtradas.length > visibles ? (
            <View style={{ marginTop: spacing.md, alignSelf: 'center', minWidth: 220 }}>
              <Button
                label={`Mostrar ${Math.min(POR_PAGINA, filtradas.length - visibles)} más`}
                variant="secondary"
                onPress={() => setVisibles((v) => v + POR_PAGINA)}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function Enlace({ texto, onPress }: { texto: string; onPress: () => void }) {
  const { colors, type } = useTheme();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8}>
      <Text style={[type.bodyMuted, { color: colors.accent, fontFamily: fonts.bodyBold }]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  celdaCompleta: { width: '100%' },
  celdaMitad: { flexBasis: '47%', flexGrow: 1, minWidth: 280 },
  filaAccion: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  punto: { width: 8, height: 8, borderRadius: 4 },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 4 },
  paso: { flexDirection: 'row', gap: 8 },
});
