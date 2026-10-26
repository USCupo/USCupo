import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { GLIFOS } from '../src/components/iconosGlifos.ts';

const require = createRequire(import.meta.url);
const IONICONS: Record<string, number> = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

function fuentes(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return fuentes(p);
    return /\.tsx?$/.test(f) && !p.endsWith('iconosGlifos.ts') ? [p] : [];
  });
}

test('el set de íconos trae cada glifo de Ionicons que nombra el código', () => {
  const faltan = new Set<string>();
  for (const f of [...fuentes('app'), ...fuentes('src')]) {
    for (const m of readFileSync(f, 'utf8').matchAll(/['"]([a-z0-9-]+)['"]/g)) {
      if (IONICONS[m[1]] !== undefined && !(m[1] in GLIFOS)) faltan.add(m[1]);
    }
  }
  assert.deepEqual([...faltan], [], 'Faltan íconos: corre `npm run iconos`');
});

test('cada glifo del set conserva el código de Ionicons', () => {
  for (const [nombre, codigo] of Object.entries(GLIFOS)) assert.equal(codigo, IONICONS[nombre], nombre);
  assert.ok(existsSync('assets/fonts/Iconos.woff2'));
});
