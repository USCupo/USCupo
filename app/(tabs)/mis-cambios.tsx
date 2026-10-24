import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Contacto } from '../../src/components/Contacto';
import { DialogosModeracion, MenuDeOferta, MenuModeracion } from '../../src/components/Moderacion';
import { OfertaCard } from '../../src/components/OfertaCard';
import { useModeracionController } from '../../src/controllers/useModeracionController';
import { EsqueletoMisCambios } from '../../src/components/Esqueleto';
import { Aviso, DialogoConfirmar, ErrorCarga, EstadoVacio, Insignia, Pantalla, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { useMisCambiosController, type AccionPendiente } from '../../src/controllers/useMisCambiosController';
import { diasRestantes } from '../../src/models/ofertas';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';

const DIALOGOS: Record<AccionPendiente['tipo'], { titulo: string; mensaje: (m: string, otro: string) => string; confirmar: string; peligroso?: boolean }> = {
  confirmar: {
    titulo: '¿Ya hicieron el cambio?',
    mensaje: (m, otro) => `Confirma solo si tú y ${otro} ya cambiaron de grupo de ${m} en la USC. La oferta pasará a tu historial.`,
    confirmar: 'Sí, ya cambiamos',
  },
  liberar: {
    titulo: '¿Liberar tu cupo?',
    mensaje: (m, otro) => `${otro} dejará de ver tu contacto y tu oferta de ${m} volverá a estar disponible para otros.`,
    confirmar: 'Liberar cupo',
    peligroso: true,
  },
  retirar: {
    titulo: '¿Retirar tu oferta?',
    mensaje: (m) => `Tu oferta de ${m} dejará de aparecer en las búsquedas. Puedes publicarla de nuevo cuando quieras.`,
    confirmar: 'Retirar oferta',
    peligroso: true,
  },
};

export default function MisCambiosScreen() {
  const c = useMisCambiosController();
  const moderacion = useModeracionController(c.recargar);
  // Un solo aviso en pantalla: el de moderación o el de la pantalla.
  const { cerrarAviso: cerrarAvisoModeracion } = moderacion;
  const { cerrarAviso: cerrarAvisoPantalla } = c;
  const cerrarAvisos = useCallback(() => {
    cerrarAvisoModeracion();
    cerrarAvisoPantalla();
  }, [cerrarAvisoModeracion, cerrarAvisoPantalla]);
  const router = useRouter();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const d = c.datos;
  const celda = breakpoint === 'compacto' ? styles.completa : styles.mitad;
  const dialogo = c.accion ? DIALOGOS[c.accion.tipo] : null;
  const vacio = d && !d.quierenMiCupo.length && !d.meInteresan.length && !d.publicadas.length;

  const plazo = (expira: string | null) => {
    const n = diasRestantes(expira);
    return n === null ? null : <Insignia texto={n === 1 ? 'Queda 1 día' : `Quedan ${n} días`} tono={n <= 2 ? 'peligro' : 'proceso'} icono="time-outline" />;
  };

  return (
    <>
      <Pantalla titulo="Mis cambios" subtitulo="Tus ofertas y las conversaciones en curso">
        {c.cargando && !d ? (
          <EsqueletoMisCambios />
        ) : c.error && !d ? (
          <ErrorCarga mensaje={c.error} onReintentar={c.recargar} />
        ) : vacio ? (
          <Tarjeta>
            <EstadoVacio
              icono="swap-horizontal"
              titulo="Aún no tienes cambios en curso"
              texto="Publica el cupo que quieres cambiar o busca ofertas de otros estudiantes."
              accion={{ label: 'Publicar un cupo', onPress: () => router.push('/publicar') }}
            />
          </Tarjeta>
        ) : d ? (
          <View style={{ gap: spacing.xl }}>
            {d.quierenMiCupo.length > 0 ? (
              <View>
                <TituloSeccion sobreFondo>Quieren tu cupo</TituloSeccion>
                <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, marginBottom: spacing.md }]}>
                  Escríbele, hagan el cambio en la USC y confírmalo aquí. Si no confirmas a tiempo, la oferta expira.
                </Text>
                <View style={[styles.rejilla, { gap: spacing.md }]}>
                  {d.quierenMiCupo.map((o) => (
                    <View key={o.id} style={celda}>
                      <OfertaCard
                        oferta={o}
                        esMia
                        menu={
                          o.interesado_id ? (
                            <MenuModeracion
                              nombre={o.interesado?.nombre_completo ?? 'este estudiante'}
                              etiqueta={`Opciones sobre ${o.interesado?.nombre_completo ?? 'este estudiante'}`}
                              onBloquear={() => moderacion.pedirBloqueo(o.interesado_id!, o.interesado?.nombre_completo ?? 'este estudiante')}
                            />
                          ) : undefined
                        }
                        pie={
                          <View style={{ gap: spacing.md }}>
                            <View style={styles.entre}>
                              <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Interesado</Text>
                              {plazo(o.expires_at)}
                            </View>
                            <Contacto contacto={d.contactos.get(o.id)} materia={o.materia.nombre} />
                            <View style={[styles.botones, { gap: spacing.sm }]}>
                              <View style={{ flex: 1 }}>
                                <Button label="Liberar" variant="secondary" onPress={() => c.pedirAccion({ tipo: 'liberar', oferta: o })} />
                              </View>
                              <View style={{ flex: 1.4 }}>
                                <Button label="Confirmar cambio" onPress={() => c.pedirAccion({ tipo: 'confirmar', oferta: o })} />
                              </View>
                            </View>
                          </View>
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {d.meInteresan.length > 0 ? (
              <View>
                <TituloSeccion sobreFondo>Te interesaron</TituloSeccion>
                <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted, marginBottom: spacing.md }]}>
                  Escríbele a quien publicó el cupo. Esa persona confirma el cambio cuando lo hagan en la USC.
                </Text>
                <View style={[styles.rejilla, { gap: spacing.md }]}>
                  {d.meInteresan.map((o) => (
                    <View key={o.id} style={celda}>
                      <OfertaCard
                        oferta={o}
                        menu={<MenuDeOferta oferta={o} moderacion={moderacion} />}
                        pie={
                          <View style={{ gap: spacing.md }}>
                            <View style={styles.entre}>
                              <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Contacto</Text>
                              {plazo(o.expires_at)}
                            </View>
                            <Contacto contacto={d.contactos.get(o.id)} materia={o.materia.nombre} />
                          </View>
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View>
              <TituloSeccion sobreFondo>Publicadas</TituloSeccion>
              {d.publicadas.length > 0 ? (
                <View style={[styles.rejilla, { gap: spacing.md }]}>
                  {d.publicadas.map((o) => (
                    <View key={o.id} style={celda}>
                      <OfertaCard
                        oferta={o}
                        esMia
                        pie={
                          <View style={[styles.botones, { gap: spacing.sm }]}>
                            <View style={{ flex: 1 }}>
                              <Button label="Retirar" variant="secondary" onPress={() => c.pedirAccion({ tipo: 'retirar', oferta: o })} />
                            </View>
                            <View style={{ flex: 1.4 }}>
                              <Button
                                label="Ver coincidencias"
                                onPress={() => router.push({ pathname: '/buscar', params: { materia: String(o.materia_id) } })}
                              />
                            </View>
                          </View>
                        }
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Tarjeta>
                  <EstadoVacio
                    icono="add-circle-outline"
                    titulo="No tienes ofertas esperando"
                    texto="Publica otro cupo si quieres cambiar más materias."
                    accion={{ label: 'Publicar un cupo', onPress: () => router.push('/publicar') }}
                  />
                </Tarjeta>
              )}
            </View>
          </View>
        ) : null}
      </Pantalla>

      <DialogoConfirmar
        visible={!!c.accion}
        titulo={dialogo?.titulo ?? ''}
        mensaje={c.errorAccion ?? (c.accion && dialogo ? dialogo.mensaje(c.accion.oferta.materia.nombre, c.accion.oferta.interesado?.nombre_completo ?? 'el otro estudiante') : '')}
        confirmar={dialogo?.confirmar ?? ''}
        peligroso={dialogo?.peligroso}
        cargando={c.ejecutando}
        onConfirmar={c.ejecutar}
        onCancelar={c.cancelarAccion}
      />
      <Aviso mensaje={moderacion.estado.aviso ?? c.aviso} onCerrar={cerrarAvisos} />
      <DialogosModeracion moderacion={moderacion} conAviso={false} />
    </>
  );
}

const styles = StyleSheet.create({
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  completa: { width: '100%' },
  mitad: { flexBasis: '47%', flexGrow: 1, minWidth: 320 },
  entre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  botones: { flexDirection: 'row' },
});
