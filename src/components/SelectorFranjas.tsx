import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { diasClave, diasCortos, PATRONES_DIAS, rangoHoras } from '../models/catalogo';
import type { BloqueHorario } from '../models/types';
import { useTheme } from '../theme/useTheme';
import { Chip } from './ui';

interface Props {
  label: string;
  ayuda?: string;
  bloques: BloqueHorario[];
  seleccionados: number[];
  onAlternar: (id: number) => void;
  /** Una sola franja (lo que tengo) o varias (lo que busco). */
  multiple?: boolean;
  /** Franjas que no se pueden elegir (p. ej. la que ya tengo, al elegir lo que busco). */
  excluidos?: number[];
  error?: string;
}

// Dos pasos cortos en vez de una lista de 66 franjas: primero los días, luego la hora.
export function SelectorFranjas({ label, ayuda, bloques, seleccionados, onAlternar, multiple, excluidos = [], error }: Props) {
  const { colors, spacing, type, radius } = useTheme();
  const primeraSeleccionada = bloques.find((b) => b.id === seleccionados[0]);
  const [dias, setDias] = useState<string>(primeraSeleccionada ? diasClave(primeraSeleccionada.dias) : diasClave(PATRONES_DIAS[6]));

  const horas = useMemo(() => bloques.filter((b) => diasClave(b.dias) === dias), [bloques, dias]);
  const elegidos = bloques.filter((b) => seleccionados.includes(b.id));
  const porDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of elegidos) m.set(diasClave(b.dias), (m.get(diasClave(b.dias)) ?? 0) + 1);
    return m;
  }, [elegidos]);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{label}</Text>
      {ayuda ? <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: 2 }]}>{ayuda}</Text> : null}

      <View
        style={[
          styles.caja,
          { borderColor: error ? colors.danger : colors.border, borderRadius: radius.card, padding: spacing.md, marginTop: spacing.sm },
        ]}
      >
        <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: spacing.sm }]}>Días</Text>
        <View style={styles.fila} accessibilityRole="radiogroup">
          {PATRONES_DIAS.map((p) => {
            const clave = diasClave(p);
            const n = porDia.get(clave);
            return (
              <Chip
                key={clave}
                texto={n ? `${diasCortos(p)} · ${n}` : diasCortos(p)}
                activo={dias === clave}
                onPress={() => setDias(clave)}
                accessibilityLabel={`Días ${clave}`}
              />
            );
          })}
        </View>

        <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.sm }]}>
          Hora ({dias})
        </Text>
        <View style={styles.fila}>
          {horas.map((b) => {
            const excluido = excluidos.includes(b.id);
            return (
              <Chip
                key={b.id}
                texto={excluido ? `${rangoHoras(b)} (la tienes)` : rangoHoras(b)}
                activo={seleccionados.includes(b.id)}
                icono={seleccionados.includes(b.id) ? 'checkmark' : undefined}
                onPress={excluido ? undefined : () => onAlternar(b.id)}
                accessibilityLabel={`${b.etiqueta}${multiple ? '' : ', única opción'}`}
              />
            );
          })}
        </View>

        {elegidos.length > 0 ? (
          <View style={[styles.resumen, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
            <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{multiple ? 'Elegidas:' : 'Elegida:'}</Text>
            <View style={styles.fila}>
              {elegidos.map((b) => (
                <Chip
                  key={b.id}
                  texto={`${diasCortos(b.dias)} ${rangoHoras(b)}`}
                  icono="close"
                  onPress={() => onAlternar(b.id)}
                  accessibilityLabel={`Quitar ${b.etiqueta}`}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
      {error ? (
        <Text role="alert" style={[type.bodyMuted, { color: colors.danger, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { borderWidth: 1 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resumen: { borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
});
