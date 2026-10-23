import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { claveFranja, diasClave, diasCortos, etiquetaFranja, PATRONES_DIAS, type Franja } from '../models/catalogo';
import { useTheme } from '../theme/useTheme';
import { Button } from './Button';
import { RangoHoras } from './SelectorHora';
import { Chip } from './ui';

interface Props {
  label: string;
  ayuda?: string;
  seleccionadas: Franja[];
  onAgregar: (f: Franja) => void;
  onQuitar: (f: Franja) => void;
  /** Una sola franja (lo que tengo) o varias (lo que busco). */
  multiple?: boolean;
  /** Franjas que no se pueden elegir (p. ej. la que ya tengo, al elegir lo que busco). */
  excluidas?: Franja[];
  error?: string;
}

// Primero los días, luego la hora exacta de inicio y fin (hora, minutos, a.m./p.m.).
export function SelectorFranjas({ label, ayuda, seleccionadas, onAgregar, onQuitar, multiple, excluidas = [], error }: Props) {
  const { colors, spacing, type, radius } = useTheme();
  const primera = seleccionadas[0];
  const [dias, setDias] = useState<string[]>(primera ? primera.dias : [...PATRONES_DIAS[6]]);
  const [inicio, setInicio] = useState(primera?.inicio ?? '07:00');
  const [fin, setFin] = useState(primera?.fin ?? '09:00');

  const porDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of seleccionadas) m.set(diasClave(f.dias), (m.get(diasClave(f.dias)) ?? 0) + 1);
    return m;
  }, [seleccionadas]);

  const borrador: Franja = { dias, inicio, fin };
  const clave = claveFranja(borrador);
  const problema =
    fin <= inicio
      ? 'La hora final debe ser después de la inicial.'
      : excluidas.some((f) => claveFranja(f) === clave)
        ? 'Ese es el horario que ya tienes.'
        : multiple && seleccionadas.some((f) => claveFranja(f) === clave)
          ? 'Ya agregaste este horario.'
          : null;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{label}</Text>
      {ayuda ? <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: 2 }]}>{ayuda}</Text> : null}

      <View
        style={[
          styles.caja,
          { borderColor: error ? colors.danger : colors.border, borderRadius: radius.card + 8, padding: spacing.md, marginTop: spacing.sm },
        ]}
      >
        <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: spacing.sm }]}>Días</Text>
        <View style={styles.fila} accessibilityRole="radiogroup">
          {PATRONES_DIAS.map((p) => {
            const k = diasClave(p);
            const n = porDia.get(k);
            return (
              <Chip
                key={k}
                texto={n ? `${diasCortos(p)} · ${n}` : diasCortos(p)}
                activo={diasClave(dias) === k}
                onPress={() => setDias([...p])}
                accessibilityLabel={`Días ${k}`}
              />
            );
          })}
        </View>

        <View style={{ marginTop: spacing.md }}>
          <RangoHoras inicio={inicio} fin={fin} onInicio={setInicio} onFin={setFin} />
        </View>

        {problema ? (
          <Text style={[type.bodyMuted, { color: colors.danger, marginTop: spacing.sm }]}>{problema}</Text>
        ) : null}

        <View style={{ marginTop: spacing.md, alignSelf: 'flex-start', minWidth: 200 }}>
          <Button
            label={multiple ? 'Agregar horario' : seleccionadas.length ? 'Cambiar por este horario' : 'Usar este horario'}
            variant="secondary"
            disabled={!!problema || (!multiple && !!primera && claveFranja(primera) === clave)}
            onPress={() => onAgregar(borrador)}
          />
        </View>

        {seleccionadas.length > 0 ? (
          <View style={[styles.resumen, { borderTopColor: colors.border, marginTop: spacing.md, paddingTop: spacing.md }]}>
            <Text style={[type.bodyMuted, { color: colors.textMuted }]}>{multiple ? 'Elegidos:' : 'Elegido:'}</Text>
            <View style={styles.fila}>
              {seleccionadas.map((f) => (
                <Chip
                  key={claveFranja(f)}
                  texto={etiquetaFranja(f)}
                  icono="close"
                  onPress={() => onQuitar(f)}
                  accessibilityLabel={`Quitar ${etiquetaFranja(f)}`}
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
