import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { metadatos } from '../../src/components/MetaPagina';
import { OfertaCard } from '../../src/components/OfertaCard';
import { SelectorLista, type ItemLista } from '../../src/components/SelectorLista';
import { TextField } from '../../src/components/TextField';
import { EsqueletoBuscar } from '../../src/components/Esqueleto';
import { DialogosModeracion, MenuDeOferta } from '../../src/components/Moderacion';
import { useModeracionController } from '../../src/controllers/useModeracionController';
import { Aviso, Chip, DialogoConfirmar, ErrorCarga, EstadoVacio, Pantalla, Tarjeta } from '../../src/components/ui';
import { useBuscarController } from '../../src/controllers/useBuscarController';
import { useAuth } from '../../src/lib/AuthContext';
import { diasClave, diasCortos, PATRONES_DIAS } from '../../src/models/catalogo';
import type { Materia } from '../../src/models/types';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';

const nombreSemestre = (m: Materia) => (m.semestre ? `Semestre ${m.semestre}` : 'Otras');

export const generateMetadata = () => metadatos({ titulo: 'Buscar' });

export default function BuscarScreen() {
  const params = useLocalSearchParams<{ materia?: string }>();
  const materiaParam = params.materia ? Number(params.materia) : undefined;
  const c = useBuscarController(materiaParam);
  const moderacion = useModeracionController(c.recargar);
  // Un solo aviso en pantalla: el de moderación o el de la pantalla.
  const { cerrarAviso: cerrarAvisoModeracion } = moderacion;
  const { cerrarAviso: cerrarAvisoPantalla } = c;
  const cerrarAvisos = useCallback(() => {
    cerrarAvisoModeracion();
    cerrarAvisoPantalla();
  }, [cerrarAvisoModeracion, cerrarAvisoPantalla]);
  const { session } = useAuth();
  const router = useRouter();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';

  // Llegar desde Inicio con otra materia actualiza el filtro.
  useEffect(() => {
    if (materiaParam) c.setMateriaId(materiaParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materiaParam]);

  const items: ItemLista[] = c.materias.map((m) => {
    const n = c.conteo.get(m.id) ?? 0;
    return { id: m.id, titulo: m.nombre, seccion: nombreSemestre(m), nota: n ? `${n} ${n === 1 ? 'oferta' : 'ofertas'}` : undefined };
  });

  const filtros = (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.fila}>
        <Chip texto="Todos los días" activo={c.dia === null} onPress={() => c.setDia(null)} />
        {PATRONES_DIAS.map((p) => (
          <Chip key={diasClave(p)} texto={diasCortos(p)} activo={c.dia === diasClave(p)} onPress={() => c.setDia(c.dia === diasClave(p) ? null : diasClave(p))} accessibilityLabel={`Tienen ${diasClave(p)}`} />
        ))}
      </View>
      {c.tieneOfertasPropias ? (
        <View style={styles.fila}>
          <Chip
            texto="Solo las que me sirven"
            icono="sparkles-outline"
            activo={c.soloCoincidencias}
            onPress={() => c.setSoloCoincidencias(!c.soloCoincidencias)}
          />
        </View>
      ) : null}
    </View>
  );

  const resultados = (
    <View style={{ gap: spacing.md }}>
      <Text style={[type.bodyMuted, { color: colors.onBackgroundMuted }]}>
        {c.resultados.length === 0
          ? 'Sin resultados'
          : `${c.resultados.length} ${c.resultados.length === 1 ? 'oferta' : 'ofertas'}${c.materiaSeleccionada ? ` de ${c.materiaSeleccionada.nombre}` : ' en tu carrera'}`}
      </Text>
      {c.resultados.length === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono="search-outline"
            titulo={c.dia || c.soloCoincidencias ? 'Nada con esos filtros' : 'Todavía nadie ofrece esta materia'}
            texto={
              c.dia || c.soloCoincidencias
                ? 'Quita algún filtro para ver más ofertas.'
                : 'Publica tu cupo: cuando alguien ofrezca el horario que buscas te aparecerá como coincidencia.'
            }
            accion={c.dia || c.soloCoincidencias ? undefined : { label: 'Publicar mi cupo', onPress: () => router.push('/publicar') }}
          />
        </Tarjeta>
      ) : (
        <View style={[styles.rejilla, { gap: spacing.md }]}>
          {c.resultados.map(({ oferta, esMatch, meSirve, mia }) => {
            const yoInteresado = oferta.interesado_id === session?.user.id;
            return (
              <View key={oferta.id} style={breakpoint === 'compacto' ? styles.completa : styles.mitad}>
                <OfertaCard
                  oferta={oferta}
                  esMatch={esMatch}
                  resaltarTiene={meSirve}
                  miBloqueActualId={mia?.bloque_actual_id}
                  mostrarMateria={!c.materiaSeleccionada}
                  menu={<MenuDeOferta oferta={oferta} moderacion={moderacion} />}
                  pie={
                    oferta.estado === 'disponible' ? (
                      <Button label="Me interesa" onPress={() => c.pedirInteres(oferta)} />
                    ) : yoInteresado ? (
                      <Button label="Ya marcaste interés · Ver contacto" variant="secondary" onPress={() => router.push('/mis-cambios')} />
                    ) : (
                      <Text style={[type.bodyMuted, { color: colors.textMuted, textAlign: 'center' }]}>
                        Otro estudiante ya está en conversación por este cupo.
                      </Text>
                    )
                  }
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Pantalla titulo="Buscar" subtitulo="Ofertas de cambio en las materias de tu carrera" anchoMax={1180}>
        {c.cargando && !c.datos ? (
          <EsqueletoBuscar />
        ) : c.error && !c.datos ? (
          <ErrorCarga mensaje={c.error} onReintentar={c.recargar} />
        ) : c.materias.length === 0 ? (
          <Tarjeta>
            <EstadoVacio icono="book-outline" titulo="Tu programa aún no tiene materias cargadas" texto="Cuando el pénsum de tu carrera esté listo podrás buscar cambios aquí." />
          </Tarjeta>
        ) : amplio ? (
          <View style={[styles.columnas, { gap: spacing.lg }]}>
            <ListaMaterias materias={c.materias} conteo={c.conteo} seleccion={c.materiaId} onElegir={c.setMateriaId} />
            <View style={{ flex: 1, gap: spacing.lg }}>
              {filtros}
              {resultados}
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <Tarjeta padding={spacing.md}>
              <SelectorLista
                label="Materia"
                placeholder="Elige una materia"
                tituloModal="¿Qué materia buscas?"
                placeholderBusqueda="Bases de datos, Cálculo…"
                items={items}
                selectedId={c.materiaId}
                onSelect={c.setMateriaId}
                opcionTodas="Todas las materias"
                onTodas={() => c.setMateriaId(null)}
              />
              {filtros}
            </Tarjeta>
            {resultados}
          </View>
        )}
      </Pantalla>

      <DialogoConfirmar
        visible={!!c.interesEn}
        titulo="¿Te interesa este cupo?"
        mensaje={
          c.errorAccion ??
          `${c.interesEn?.dueno?.nombre_completo ?? 'El estudiante'} recibirá un aviso y ambos verán sus datos de contacto. El cupo queda reservado para ustedes 7 días.`
        }
        confirmar="Sí, me interesa"
        cargando={c.enviandoInteres}
        onConfirmar={c.confirmarInteres}
        onCancelar={c.cancelarInteres}
      />
      <Aviso mensaje={moderacion.estado.aviso ?? c.aviso} onCerrar={cerrarAvisos} />
      <DialogosModeracion moderacion={moderacion} conAviso={false} />
    </>
  );
}

// Columna de materias para PC: búsqueda + lista con el número de ofertas de cada una.
function ListaMaterias({ materias, conteo, seleccion, onElegir }: { materias: Materia[]; conteo: Map<number, number>; seleccion: number | null; onElegir: (id: number | null) => void }) {
  const { colors, spacing, type, radius } = useTheme();
  const [q, setQ] = useState('');
  const visibles = useMemo(() => {
    const f = q
      .trim()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    return materias.filter((m) => !f || m.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(f));
  }, [materias, q]);

  const fila = (id: number | null, titulo: string, sub: string | null, n?: number) => {
    const sel = seleccion === id;
    return (
      <Pressable
        key={id ?? 'todas'}
        accessibilityRole="radio"
        accessibilityState={{ checked: sel }}
        onPress={() => onElegir(id)}
        style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [
          styles.materia,
          { borderRadius: radius.control, backgroundColor: sel ? colors.primaryTint : hovered ? colors.primaryTint : 'transparent', paddingHorizontal: spacing.sm + 2 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.bodyMuted, { color: colors.text, fontFamily: sel ? fonts.bodyBold : fonts.body, fontSize: 14 }]} numberOfLines={2}>
            {titulo}
          </Text>
          {sub ? <Text style={[type.bodyMuted, { color: colors.textMuted, fontSize: 12 }]}>{sub}</Text> : null}
        </View>
        {n ? (
          <View style={[styles.cuenta, { backgroundColor: sel ? colors.primary : colors.accentTint }]}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: sel ? colors.onPrimary : colors.accentText }}>{n}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Tarjeta style={{ width: 300 }} padding={spacing.md}>
      <TextField label="Materias de tu carrera" placeholder="Filtrar materias…" value={q} onChangeText={setQ} autoCorrect={false} />
      <View style={{ gap: 2 }}>
        {!q ? fila(null, 'Todas las materias', null, Array.from(conteo.values()).reduce((a, b) => a + b, 0)) : null}
        {visibles.map((m) => fila(m.id, m.nombre, m.semestre ? `Semestre ${m.semestre}` : null, conteo.get(m.id)))}
        {visibles.length === 0 ? <Text style={[type.bodyMuted, { color: colors.textMuted, padding: spacing.sm }]}>Ninguna materia coincide.</Text> : null}
      </View>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap' },
  completa: { width: '100%' },
  mitad: { flexBasis: '47%', flexGrow: 1, minWidth: 300 },
  materia: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 6 },
  cuenta: { minWidth: 24, height: 22, borderRadius: 11, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
});
