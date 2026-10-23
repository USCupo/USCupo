import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Interruptor } from '../../src/components/Contacto';
import { OfertaCard } from '../../src/components/OfertaCard';
import { TextField } from '../../src/components/TextField';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { Aviso, DialogoConfirmar, Pantalla, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { usePerfilController } from '../../src/controllers/usePerfilController';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';

export default function PerfilScreen() {
  const c = usePerfilController();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';
  const d = c.datos;

  return (
    <>
      <Pantalla titulo="Perfil" subtitulo={c.correo}>
        <View style={[amplio && styles.columnas, { gap: spacing.lg }]}>
          <View style={[amplio && { flex: 1.3 }, { gap: spacing.lg }]}>
            <Tarjeta>
              <TituloSeccion>Tus datos</TituloSeccion>
              <TextField label="Nombre completo" value={c.campos.nombre} onChangeText={c.setNombre} error={c.errores.nombre} autoCapitalize="words" autoComplete="name" />
              <View style={[styles.dato, { marginBottom: spacing.md }]}>
                <Text style={[type.bodyMuted, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Carrera</Text>
                <Text style={[type.body, { color: colors.text, marginTop: spacing.xs }]}>
                  {d?.carrera ? `${d.carrera.nombre} · ${d.carrera.sede}` : '—'}
                </Text>
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Tu carrera define qué materias ves al buscar y publicar.</Text>
              </View>

              <TituloSeccion>Cómo te contactan</TituloSeccion>
              <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: spacing.md }]}>
                Solo lo ve el estudiante con quien tienes un cambio en curso.
              </Text>
              <TextField
                label="WhatsApp (opcional)"
                placeholder="300 123 4567"
                value={c.campos.whatsapp}
                onChangeText={c.setWhatsapp}
                error={c.errores.whatsapp}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
              <Interruptor label="Mostrar mi correo institucional" descripcion={c.correo} valor={c.campos.mostrarCorreo} onCambiar={c.setMostrarCorreo} />
              <Interruptor
                label="Mostrar mi WhatsApp"
                descripcion={c.campos.whatsapp ? undefined : 'Agrega tu número arriba para mostrarlo'}
                valor={c.campos.mostrarWhatsapp}
                onCambiar={c.setMostrarWhatsapp}
              />

              {c.errorGuardar ? (
                <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginTop: spacing.md }]}>
                  {c.errorGuardar}
                </Text>
              ) : null}
              <View style={{ marginTop: spacing.lg }}>
                <Button label="Guardar cambios" loadingLabel="Guardando…" onPress={c.guardar} loading={c.guardando} disabled={!c.hayCambios} />
              </View>
            </Tarjeta>
          </View>

          <View style={[amplio && { flex: 1 }, { gap: spacing.lg }]}>
            <Tarjeta>
              <TituloSeccion>Apariencia</TituloSeccion>
              <View style={[styles.entre, { padding: spacing.md, borderRadius: 14, backgroundColor: colors.background }]}>
                <Text style={[type.body, { color: colors.onBackground }]}>Tema claro u oscuro</Text>
                <ThemeToggle />
              </View>
            </Tarjeta>

            <Tarjeta>
              <TituloSeccion>Historial</TituloSeccion>
              {!d || d.historial.length === 0 ? (
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Aquí quedarán los cambios que confirmes.</Text>
              ) : (
                <View style={{ gap: spacing.md }}>
                  <Text style={[type.bodyMuted, { color: colors.textMuted }]}>
                    {d.resueltas} {d.resueltas === 1 ? 'cambio concretado' : 'cambios concretados'} con USCupo
                  </Text>
                  {d.historial.map((o) => (
                    <OfertaCard key={o.id} oferta={o} esMia />
                  ))}
                </View>
              )}
            </Tarjeta>

            <Tarjeta>
              <TituloSeccion>Sesión</TituloSeccion>
              <Button label="Cerrar sesión" variant="secondary" onPress={c.pedirSalida} style={{ borderWidth: 1, borderColor: colors.danger }} />
            </Tarjeta>
          </View>
        </View>
      </Pantalla>

      <DialogoConfirmar
        visible={c.confirmarSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tendrás que ingresar de nuevo con tu correo institucional."
        confirmar="Cerrar sesión"
        peligroso
        onConfirmar={c.salir}
        onCancelar={c.cancelarSalida}
      />
      <Aviso mensaje={c.aviso} onCerrar={c.cerrarAviso} />
    </>
  );
}

const styles = StyleSheet.create({
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  dato: {},
  entre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
