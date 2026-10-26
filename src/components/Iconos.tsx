import { Text, type ColorValue, type TextProps } from 'react-native';
import { GLIFOS } from './iconosGlifos';

// Ionicons con solo los glifos que usa la app (~200 KB menos en la primera carga). La fuente la
// carga RootLayout (FAMILIA_ICONOS). Un ícono nuevo: usarlo en el código y correr `npm run iconos`.
// No usa createIconSet de @expo/vector-icons: ese pinta vacío hasta que la fuente carga, y el
// HTML del build (sin fuente) no coincidía con el primer render del navegador.
export const FAMILIA_ICONOS = 'uscupo-iconos';

type Props = TextProps & { name: keyof typeof GLIFOS; size?: number; color?: ColorValue };

export default function Ionicons({ name, size = 12, color = 'black', style, ...props }: Props) {
  return (
    <Text
      selectable={false}
      {...props}
      style={[{ fontSize: size, color }, style, { fontFamily: FAMILIA_ICONOS, fontWeight: 'normal', fontStyle: 'normal' }]}
    >
      {String.fromCodePoint(GLIFOS[name])}
    </Text>
  );
}
