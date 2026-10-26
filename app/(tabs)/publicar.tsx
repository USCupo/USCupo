import Ionicons from '../../src/components/Iconos';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { InfoNotice } from '../../src/components/InfoNotice';
import { SelectorFranjas } from '../../src/components/SelectorFranjas';
import { SelectorLista, type ItemLista } from '../../src/components/SelectorLista';
import { TextField } from '../../src/components/TextField';
import { EsqueletoFormulario } from '../../src/components/Esqueleto';
import { ErrorCarga, EstadoVacio, Pantalla, Tarjeta } from '../../src/components/ui';
import { usePublicarController } from '../../src/controllers/usePublicarController';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';

export default function PublicarScreen() {
  const c = usePublicarController();
  const router = useRouter();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';

  const items: ItemLista[] = c.materias.map((m) => ({
    id: m.id,
    titulo: m.nombre,
    subtitulo: m.codigo,
    seccion: m.semestre ? `Semestre ${m.semestre}` : 'Otras',
    nota: c.materiasConOfertaActiva.has(m.id) ? 'Ya publicada' : undefined,
  }));

  if (c.publicada) {
    const p = c.publicada;
    return (
      <Pantalla titulo="Publicar" anchoMax={640}>
        <Tarjeta>
          <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
            <View style={[styles.icono, { backgroundColor: colors.accentTint }]}>
              <Ionicons name="checkmark" size={30} color={colors.accentText} />
            </View>
            <Text accessibilityRole="header" style={[type.sectionTitle, { color: colors.text, marginTop: spacing.md, textAlign: 'center' }]}>
              Tu cupo de {p.materiaNombre} está publicado
            </Text>
            <Text style={[type.body, { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }]}>
              {p.coincidencias > 0
                ? `Hay ${p.coincidencias} ${p.coincidencias === 1 ? 'estudiante que tiene' : 'estudiantes que tienen'} el horario que buscas y busca${p.coincidencias === 1 ? '' : 'n'} el tuyo.`
                : 'Todavía nadie hace el cambio inverso. Te avisaremos en Inicio cuando aparezca alguien.'}
            </Text>
          </View>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {p.coincidencias > 0 ? (
              <Button label="Ver coincidencias" onPress={() => router.push({ pathname: '/buscar', params: { materia: String(p.materiaId) } })} />
            ) : (
              <Button label="Ver ofertas de esta materia" onPress={() => router.push({ pathname: '/buscar', params: { materia: String(p.materiaId) } })} />
            )}
            <Button label="Publicar otro cupo" variant="secondary" onPress={c.reiniciar} />
          </View>
        </Tarjeta>
      </Pantalla>
    );
  }

  return (
    <Pantalla titulo="Publicar un cupo" subtitulo="Cuenta qué grupo tienes y qué horarios te sirven" anchoMax={amplio ? 1080 : 720}>
      {c.cargando && !c.datos ? (
        <EsqueletoFormulario />
      ) : c.error && !c.datos ? (
        <ErrorCarga mensaje={c.error} onReintentar={c.recargar} />
      ) : c.materias.length === 0 ? (
        <Tarjeta>
          <EstadoVacio icono="book-outline" titulo="Tu programa aún no tiene materias cargadas" texto="Cuando el pénsum de tu carrera esté listo podrás publicar cupos." />
        </Tarjeta>
      ) : (
        <View style={[amplio && styles.columnas, { gap: spacing.lg }]}>
          <Tarjeta style={amplio ? { flex: 1 } : undefined}>
            <Seccion n={1} titulo="La materia" />
            <SelectorLista
              label="Materia"
              placeholder="Elige la materia"
              tituloModal="¿Qué materia quieres cambiar?"
              placeholderBusqueda="Bases de datos, Cálculo…"
              items={items}
              selectedId={c.campos.materiaId}
              onSelect={c.elegirMateria}
              error={c.errores.materia}
            />
            <TextField
              label="Tu grupo"
              placeholder="Ej. 02"
              value={c.campos.grupo}
              onChangeText={c.setGrupo}
              error={c.errores.grupo}
              autoCapitalize="characters"
              maxLength={10}
            />

            <Seccion n={2} titulo="Lo que tienes" />
            <SelectorFranjas
              label="Horario de tu grupo"
              ayuda="Elige los días y escribe la hora exacta de la clase."
              seleccionadas={c.campos.actual ? [c.campos.actual] : []}
              onAgregar={c.elegirActual}
              onQuitar={c.quitarActual}
              error={c.errores.actual}
            />

            <Seccion n={3} titulo="Lo que buscas" />
            <SelectorFranjas
              label="Horarios que te sirven"
              ayuda="Elige todos los que puedas tomar: más opciones, más coincidencias."
              seleccionadas={c.campos.busco}
              onAgregar={c.agregarBusco}
              onQuitar={c.quitarBusco}
              excluidas={c.campos.actual ? [c.campos.actual] : []}
              multiple
              error={c.errores.busco}
            />

            <TextField
              label="Comentario (opcional)"
              placeholder="Ej. Prefiero mañanas, puedo cambiar esta semana."
              value={c.campos.comentario}
              onChangeText={c.setComentario}
              multiline
              maxLength={200}
              style={{ minHeight: 88, paddingTop: 12, textAlignVertical: 'top' }}
            />

            {c.errorFormulario ? (
              <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginBottom: spacing.md }]}>
                {c.errorFormulario}
              </Text>
            ) : null}
            <Button label="Publicar cupo" loadingLabel="Publicando…" onPress={c.publicar} loading={c.publicando} />
          </Tarjeta>

          <View style={[amplio && { width: 300 }, { gap: spacing.md }]}>
            <InfoNotice>
              Tu nombre, la materia, el grupo y los horarios son visibles para estudiantes de tu carrera. Tu correo y WhatsApp solo los ve quien marque interés.
            </InfoNotice>
            <InfoNotice>
              USCupo solo conecta estudiantes: el cambio se hace en los canales oficiales de la USC. Cuando lo concreten, confírmalo en Mis cambios.
            </InfoNotice>
          </View>
        </View>
      )}
    </Pantalla>
  );
}

function Seccion({ n, titulo }: { n: number; titulo: string }) {
  const { colors, spacing, type } = useTheme();
  return (
    <View style={[styles.seccion, { marginBottom: spacing.md, marginTop: n > 1 ? spacing.sm : 0 }]}>
      <View style={[styles.numero, { borderColor: colors.accentText }]}>
        <Text style={{ color: colors.accentText, fontFamily: fonts.bodyBold, fontSize: 13 }}>{n}</Text>
      </View>
      <Text accessibilityRole="header" style={[type.cardTitle, { color: colors.text, fontSize: 17 }]}>
        {titulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  icono: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  seccion: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numero: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
