import Svg, { G, Path } from 'react-native-svg';
import { usc } from '../theme/colors';
import { FLECHA, FLECHA_GIRO, PALABRA_UPO, PALABRA_USC } from './logoPaths';

// Sobre fondo blanco el logo va en azul nativo + amarillo; sobre azul, la parte azul pasa
// a blanco para no perderse (el amarillo se mantiene como acento).
export type FondoLogo = 'blanco' | 'azul';

function tintas(sobre: FondoLogo) {
  return { principal: sobre === 'azul' ? usc.blanco : usc.azulNativo, acento: usc.amarillo };
}

/** Solo el símbolo (dos flechas que se intercambian). */
export function Logo({ size = 40, sobre = 'blanco' }: { size?: number; sobre?: FondoLogo }) {
  const { principal, acento } = tintas(sobre);
  return (
    <Svg width={size} height={size} viewBox="4.5 -46.6 450 450" accessibilityLabel="USCupo">
      <Path d={FLECHA} fill={principal} />
      <Path d={FLECHA} fill={acento} transform={FLECHA_GIRO} />
    </Svg>
  );
}

/** Símbolo + wordmark "USCupo" en composición vertical. */
export function LogoCompleto({ width = 160, sobre = 'blanco' }: { width?: number; sobre?: FondoLogo }) {
  const { principal, acento } = tintas(sobre);
  return (
    <Svg width={width} height={(width * 484) / 459} viewBox="0 0 459 484" accessibilityLabel="USCupo">
      <G>
        <Path d={FLECHA} fill={principal} />
        <Path d={FLECHA} fill={acento} transform={FLECHA_GIRO} />
      </G>
      <Path d={PALABRA_USC} fill={principal} />
      <Path d={PALABRA_UPO} fill={acento} />
    </Svg>
  );
}
