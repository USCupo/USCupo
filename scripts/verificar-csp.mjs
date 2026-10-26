// Tras `expo export`: cada <script> en línea de dist/*.html debe estar permitido por su sha256 en
// la CSP de vercel.json; si no, el navegador lo bloquea (p. ej. el de hidratación de Expo Router).
// Falla el build y muestra el hash que falta. Los bloques application/ld+json son datos y no cuentan.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const csp = JSON.parse(readFileSync('vercel.json', 'utf8'))
  .headers.flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy').value;
const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));

const htmls = [];
const recorrer = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (f.endsWith('.html')) htmls.push(p);
  }
};
recorrer('dist');

const faltan = new Map();
for (const f of htmls) {
  for (const m of readFileSync(f, 'utf8').matchAll(/<script(?![^>]*\s(?:src=|type="application\/ld\+json"))[^>]*>([\s\S]*?)<\/script>/g)) {
    const hash = `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`;
    if (!scriptSrc.includes(hash)) faltan.set(hash, m[1].slice(0, 80));
  }
}

if (faltan.size) {
  for (const [hash, inicio] of faltan) console.error(`CSP: falta ${hash} en script-src (script: ${inicio})`);
  process.exit(1);
}
console.log(`CSP: ${htmls.length} páginas, scripts en línea permitidos`);
