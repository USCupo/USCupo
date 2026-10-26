import Ionicons from './Iconos';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { diasCortos, rangoHoras } from '../models/catalogo';
import { hace, type OfertaDetalle } from '../models/ofertas';
import type { BloqueHorario } from '../models/types';
import { cristalClaro } from '../theme/glass';
import { useTheme } from '../theme/useTheme';
import { Insignia } from './ui';
import { fonts } from '../theme/typography';

interface Props {
  oferta: OfertaDetalle;
  /** Bloques que el usuario busca: se resaltan en la franja que el otro ofrece. */
  resaltarTiene?: boolean;
  /** Bloque que el usuario tiene: se resalta si el otro lo busca. */
  miBloqueActualId?: number | null;
  esMatch?: boolean;
  esMia?: boolean;
  pie?: ReactNode;
  /** Reportar/bloquear: va junto al nombre de quien la publicó. */
  menu?: ReactNode;
  mostrarMateria?: boolean;
}

/** "9:00 a.m." nunca se parte en dos líneas: espacio no separable antes de a.m./p.m./m. */
const sinPartirHoras = (texto: string) => texto.replace(/ (a\.m\.|p\.m\.|m\.)/g, ' $1');

function Franja({ bloque, resaltada }: { bloque: BloqueHorario; resaltada?: boolean }) {
  const { colors, type, radius } = useTheme();
  return (
    <View
      style={[
        styles.franja,
        {
          borderRadius: radius.control - 2,
          backgroundColor: resaltada ? colors.accentTint : colors.primaryTint,
          borderColor: resaltada ? colors.accent : 'transparent',
        },
      ]}
    >
      <Text style={[type.bodyMuted, { color: colors.text, fontFamily: fonts.bodyBold, textAlign: 'center' }]}>{diasCortos(bloque.dias)}</Text>
      <Text style={[type.bodyMuted, { color: colors.textMuted, textAlign: 'center' }]}>{sinPartirHoras(rangoHoras(bloque))}</Text>
    </View>
  );
}

export function OfertaCard({ oferta, resaltarTiene, miBloqueActualId, esMatch, esMia, pie, menu, mostrarMateria = true }: Props) {
  const { colors, spacing, type, radius } = useTheme();
  const enProceso = oferta.estado === 'en_proceso';

  return (
    <View
      style={[
        cristalClaro(colors),
        {
          borderColor: esMatch ? colors.accent : colors.border,
          borderWidth: esMatch ? 1.5 : StyleSheet.hairlineWidth,
          borderRadius: radius.card + 4,
          padding: spacing.md + 4,
        },
      ]}
    >
      <View style={styles.cabecera}>
        <View style={{ flex: 1 }}>
          {mostrarMateria ? (
            <Text style={[type.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {oferta.materia.nombre}
            </Text>
          ) : null}
          <Text style={[type.bodyMuted, { color: colors.textMuted, marginTop: 2 }]}>
            Grupo {oferta.grupo}
            {oferta.materia.semestre ? ` · Semestre ${oferta.materia.semestre}` : ''}
          </Text>
        </View>
        <View style={{ gap: 6, alignItems: 'flex-end' }}>
          {esMatch ? <Insignia texto="Match" tono="match" icono="swap-horizontal" /> : null}
          {enProceso ? <Insignia texto="En proceso" tono="proceso" icono="time-outline" /> : null}
          {oferta.estado === 'resuelta' ? <Insignia texto="Resuelta" tono="exito" icono="checkmark" /> : null}
          {oferta.estado === 'expirada' ? <Insignia texto="Expirada" tono="peligro" /> : null}
        </View>
      </View>

      <View style={[styles.intercambio, { marginTop: spacing.md, gap: spacing.md }]}>
        <View style={styles.columna}>
          <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: 6, textAlign: 'center' }]}>Tiene</Text>
          <Franja bloque={oferta.bloque_actual} resaltada={resaltarTiene} />
        </View>
        <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} style={{ marginTop: 26 }} />
        <View style={styles.columna}>
          <Text style={[type.bodyMuted, { color: colors.textMuted, marginBottom: 6, textAlign: 'center' }]}>Busca</Text>
          <View style={{ gap: 6 }}>
            {oferta.busco.map((b) => (
              <Franja key={b.id} bloque={b} resaltada={miBloqueActualId === b.id} />
            ))}
          </View>
        </View>
      </View>

      {oferta.comentario ? (
        <Text style={[type.bodyMuted, { color: colors.text, marginTop: spacing.md, fontStyle: 'italic' }]}>
          “{oferta.comentario}”
        </Text>
      ) : null}

      <View style={[styles.pieMeta, { marginTop: spacing.md, borderTopColor: colors.border, paddingTop: menu ? spacing.xs : spacing.sm + 2 }]}>
        <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
        <Text style={[type.bodyMuted, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>
          {esMia ? 'Tu oferta' : (oferta.dueno?.nombre_completo ?? 'Estudiante USC')} · {hace(oferta.created_at)}
        </Text>
        {menu}
      </View>

      {pie ? <View style={{ marginTop: spacing.md }}>{pie}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  intercambio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  columna: {
    flex: 1,
    minWidth: 0,
  },
  franja: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
