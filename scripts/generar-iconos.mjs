// Genera el set de íconos de la web con solo los glifos de Ionicons que usa el código:
//   src/components/iconosGlifos.ts  (nombre → código; define también el tipo de `name`)
//   assets/fonts/Iconos.woff2       (Ionicons.ttf recortado a esos glifos)
// La fuente la carga app/_layout.tsx. Ejecutar tras usar un ícono nuevo: `npm run iconos` (requiere Python con fonttools y brotli).
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const base = '@expo/vector-icons/build/vendor/react-native-vector-icons';
const glifos = require(`${base}/glyphmaps/Ionicons.json`);
const ttf = require.resolve(`${base}/Fonts/Ionicons.ttf`);

const archivos = [];
const recorrer = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (/\.tsx?$/.test(f) && !p.endsWith('iconosGlifos.ts')) archivos.push(p);
  }
};
recorrer('app');
recorrer('src');

// Cualquier literal que coincida con un glifo cuenta; sobra alguno, pero no falta ninguno
// (los nombres nunca se arman por concatenación; si alguno falta, tsc lo marca).
const usados = new Set();
for (const f of archivos) {
  for (const m of readFileSync(f, 'utf8').matchAll(/['"]([a-z0-9-]+)['"]/g)) {
    if (glifos[m[1]] !== undefined) usados.add(m[1]);
  }
}
const nombres = [...usados].sort();

const cuerpo = nombres.map((n) => `  '${n}': ${glifos[n]},`).join('\n');
writeFileSync(
  'src/components/iconosGlifos.ts',
  `// Generado por scripts/generar-iconos.mjs; no editar a mano.\nexport const GLIFOS = {\n${cuerpo}\n} as const;\n`
);

const unicodes = nombres.map((n) => `U+${glifos[n].toString(16).toUpperCase()}`).join(',');
execFileSync('python', ['-m', 'fontTools.subset', ttf, `--unicodes=${unicodes}`, '--flavor=woff2', '--output-file=assets/fonts/Iconos.woff2'], {
  stdio: 'inherit',
});
console.log(`${nombres.length} íconos`);
