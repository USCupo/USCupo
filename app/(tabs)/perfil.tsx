import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Interruptor } from '../../src/components/Contacto';
import { InfoNotice } from '../../src/components/InfoNotice';
import { OfertaCard } from '../../src/components/OfertaCard';
import { PieLegal } from '../../src/components/PieLegal';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import { TextField } from '../../src/components/TextField';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { Aviso, DialogoConfirmar, Pantalla, Tarjeta, TituloSeccion } from '../../src/components/ui';
import { PALABRA_ELIMINAR, usePerfilController } from '../../src/controllers/usePerfilController';
import { AVISO_NO_OFICIAL } from '../../src/models/legal';
import { useBreakpoint } from '../../src/theme/useBreakpoint';
import { useTheme } from '../../src/theme/useTheme';
import { fonts } from '../../src/theme/typography';

export default function PerfilScreen() {
  const c = usePerfilController();
  const { colors, spacing, type } = useTheme();
  const { breakpoint } = useBreakpoint();
  const amplio = breakpoint === 'amplio';
  // En computador el tema y Cerrar sesión están en la navbar; desde tablet el aviso y los
  // enlaces legales están en el FooterWeb.
  const conFooter = breakpoint !== 'compacto';
  const eliminarCuenta = (
    <Pressable
      accessibilityRole="button"
      onPress={c.pedirEliminar}
      style={{ marginTop: spacing.xs, alignItems: 'center', paddingVertical: spacing.sm, minHeight: 44, justifyContent: 'center' }}
    >
      <Text style={[type.body, { color: colors.danger, fontFamily: fonts.bodyBold }]}>Eliminar cuenta</Text>
    </Pressable>
  );
  const d = c.datos;

  return (
    <>
      <Pantalla titulo="Perfil" subtitulo={c.correo}>
        <View style={[amplio && styles.columnas, { gap: spacing.lg }]}>
          <View style={[amplio && { flex: 1.3 }, { gap: spacing.lg }]}>
            {c.esAdmin ? (
              <InfoNotice>
                Cuenta de revisión (admin): ves y usas solo ofertas de prueba. Los estudiantes reales no las ven.
              </InfoNotice>
            ) : null}
            <Tarjeta>
              <TituloSeccion>Tus datos</TituloSeccion>
              <TextField label="Nombre completo" value={c.campos.nombre} onChangeText={c.setNombre} error={c.errores.nombre} autoCapitalize="words" autoComplete="name" />
              <View style={[styles.dato, { marginBottom: spacing.md }]}>
                <Text style={[type.bodyMuted, { color: colors.text, fontFamily: fonts.bodyBold }]}>Carrera</Text>
                <Text style={[type.body, { color: colors.text, marginTop: spacing.xs }]}>
                  {d?.carrera ? `${d.carrera.nombre} · ${d.carrera.sede}` : '—'}
                </Text>
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>Tu carrera define qué materias ves al buscar y publicar.</Text>
              </View>

              <TituloSeccion>Cómo te contactan</TituloSeccion>
              <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: spacing.md }]}>
                Solo lo ve el estudiante con quien tienes un cambio en curso.
              </Text>
              <Text style={[type.body, { color: colors.text, marginBottom: spacing.xs }]}>WhatsApp (opcional)</Text>
              <SegmentedControl
                options={['Número', 'Nombre de usuario']}
                selectedIndex={c.campos.tipoWhatsapp === 'usuario' ? 1 : 0}
                onChange={(i) => c.setTipoWhatsapp(i === 1 ? 'usuario' : 'numero')}
              />
              <View style={{ marginTop: spacing.sm }}>
                {c.campos.tipoWhatsapp === 'usuario' ? (
                  <TextField
                    label="Tu nombre de usuario de WhatsApp"
                    placeholder="@tu.usuario"
                    value={c.campos.whatsapp}
                    onChangeText={c.setWhatsapp}
                    error={c.errores.whatsapp}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                  />
                ) : (
                  <TextField
                    label="Tu número de WhatsApp"
                    placeholder="300 123 4567"
                    value={c.campos.whatsapp}
                    onChangeText={c.setWhatsapp}
                    error={c.errores.whatsapp}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                )}
              </View>
              <Interruptor label="Mostrar mi correo institucional" descripcion={c.correo} valor={c.campos.mostrarCorreo} onCambiar={c.setMostrarCorreo} />
              <Interruptor
                label="Mostrar mi WhatsApp"
                descripcion={c.campos.whatsapp ? undefined : c.campos.tipoWhatsapp === 'usuario' ? 'Agrega tu usuario arriba para mostrarlo' : 'Agrega tu número arriba para mostrarlo'}
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
            {amplio ? eliminarCuenta : null}
          </View>

          <View style={[amplio && { flex: 1 }, { gap: spacing.lg }]}>
            {amplio ? null : (
              <Tarjeta>
                <TituloSeccion>Apariencia</TituloSeccion>
                <View style={[styles.entre, { padding: spacing.md, borderRadius: 14, backgroundColor: colors.background }]}>
                  <Text style={[type.body, { color: colors.onBackground }]}>Tema claro u oscuro</Text>
                  <ThemeToggle />
                </View>
              </Tarjeta>
            )}

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

            {d && d.bloqueados.length > 0 ? (
              <Tarjeta>
                <TituloSeccion>Usuarios bloqueados</TituloSeccion>
                <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                  No ven tus ofertas ni tú las suyas.
                </Text>
                {d.bloqueados.map((u) => (
                  <View key={u.usuario_id} style={[styles.entre, styles.bloqueado, { borderTopColor: colors.border }]}>
                    <Text style={[type.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {u.nombre_completo}
                    </Text>
                    <Button
                      label="Desbloquear"
                      variant="secondary"
                      onPress={() => c.desbloquear(u)}
                      loading={c.desbloqueando === u.usuario_id}
                      loadingLabel="Desbloqueando…"
                      disabled={!!c.desbloqueando}
                    />
                  </View>
                ))}
              </Tarjeta>
            ) : null}

            {conFooter ? null : (
              <Tarjeta>
                <TituloSeccion>Acerca de USCupo</TituloSeccion>
                <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{AVISO_NO_OFICIAL}</Text>
                <View style={{ marginTop: spacing.sm }}>
                  <PieLegal />
                </View>
              </Tarjeta>
            )}

            {amplio ? null : (
              <Tarjeta>
                <TituloSeccion>Sesión</TituloSeccion>
                <Button label="Cerrar sesión" variant="secondary" onPress={c.pedirSalida} style={{ borderWidth: 1, borderColor: colors.danger }} />
                {eliminarCuenta}
              </Tarjeta>
            )}
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
      <DialogoConfirmar
        visible={c.confirmarEliminar}
        titulo="¿Eliminar tu cuenta?"
        mensaje="Se borran para siempre tu perfil, todas tus ofertas (también las que están en conversación), tus avisos y tu historial. Si marcaste interés en la oferta de otra persona, esa oferta vuelve a quedar disponible. No se puede deshacer."
        confirmar="Eliminar"
        peligroso
        cargando={c.eliminando}
        error={c.errorEliminar}
        confirmarDeshabilitado={!c.puedeEliminar}
        onConfirmar={c.eliminarCuenta}
        onCancelar={c.cancelarEliminar}
      >
        <TextField
          label={`Escribe ${PALABRA_ELIMINAR} para confirmar`}
          value={c.textoEliminar}
          onChangeText={c.setTextoEliminar}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!c.eliminando}
          onSubmitEditing={c.eliminarCuenta}
        />
      </DialogoConfirmar>
      <Aviso mensaje={c.aviso} onCerrar={c.cerrarAviso} />
    </>
  );
}

const styles = StyleSheet.create({
  columnas: { flexDirection: 'row', alignItems: 'flex-start' },
  dato: {},
  entre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  bloqueado: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
});
