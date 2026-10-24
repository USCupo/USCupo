import Svg, { G, Path } from 'react-native-svg';
import { usc } from '../theme/colors';
import {
  FLECHA_C,
  FLECHA_U,
  ISOTIPO_TRANSFORM,
  ISOTIPO_VIEWBOX,
  PALABRA_UPO,
  PALABRA_USC,
  VERTICAL_TRANSFORM,
  VERTICAL_VIEWBOX,
} from './logoPaths';

// Sobre fondo blanco el logo va en azul nativo + amarillo; sobre azul, la parte azul pasa
// a blanco para no perderse (versión "negativo" del kit; el amarillo se mantiene como acento).
export type FondoLogo = 'blanco' | 'azul';

function tintas(sobre: FondoLogo) {
  return { principal: sobre === 'azul' ? usc.blanco : usc.azulNativo, acento: usc.amarillo };
}

/** Solo el isotipo (flechas U y C que se intercambian). */
export function Logo({ size = 40, sobre = 'blanco' }: { size?: number; sobre?: FondoLogo }) {
  const { principal, acento } = tintas(sobre);
  return (
    <Svg width={size} height={size} viewBox={ISOTIPO_VIEWBOX} accessibilityLabel="USCupo">
      <G transform={ISOTIPO_TRANSFORM}>
        <Path d={FLECHA_U} fill={principal} />
        <Path d={FLECHA_C} fill={acento} />
      </G>
    </Svg>
  );
}

/** Isotipo + wordmark "USCupo" en composición vertical. */
export function LogoCompleto({ width = 160, sobre = 'blanco' }: { width?: number; sobre?: FondoLogo }) {
  const { principal, acento } = tintas(sobre);
  return (
    <Svg width={width} height={(width * 464.2) / 455} viewBox={VERTICAL_VIEWBOX} accessibilityLabel="USCupo">
      <G transform={VERTICAL_TRANSFORM}>
        <Path d={FLECHA_U} fill={principal} />
        <Path d={FLECHA_C} fill={acento} />
        <Path d={PALABRA_USC} fill={principal} />
        <Path d={PALABRA_UPO} fill={acento} />
      </G>
    </Svg>
  );
}
