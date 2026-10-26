import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { markdownDe, pideMarkdown, responderMarkdown } from '../src/lib/markdown.ts';
import { DATOS_ESTRUCTURADOS, URL_SITIO } from '../src/models/informacion.ts';

const pedir = (ruta: string, accept: string, method = 'GET') => responderMarkdown(new Request(`${URL_SITIO}${ruta}`, { method, headers: { accept } }));

test('pideMarkdown respeta Accept y q=0', () => {
  assert.equal(pideMarkdown('text/markdown'), true);
  assert.equal(pideMarkdown('text/html;q=0.9, text/markdown'), true);
  assert.equal(pideMarkdown('TEXT/MARKDOWN; charset=utf-8'), true);
  assert.equal(pideMarkdown('text/markdown;q=0'), false);
  assert.equal(pideMarkdown('text/html,application/xhtml+xml,*/*;q=0.8'), false);
  assert.equal(pideMarkdown(null), false);
});

test('con Accept: text/markdown la portada responde Markdown con Vary: Accept', async () => {
  const r = pedir('/', 'text/markdown')!;
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'text/markdown; charset=utf-8');
  assert.equal(r.headers.get('vary'), 'Accept');
  const cuerpo = await r.text();
  assert.match(cuerpo, /^# USCupo/);
  assert.ok(cuerpo.length > 500);
});

test('con Accept: text/html no intercepta (sigue el HTML estático)', () => {
  assert.equal(pedir('/', 'text/html'), null);
  assert.equal(pedir('/login', 'text/html,application/xhtml+xml'), null);
  assert.equal(responderMarkdown(new Request(`${URL_SITIO}/`, { method: 'POST', headers: { accept: 'text/markdown' } })), null);
});

test('una ruta inexistente da 404 con cuerpo Markdown y enlaces a sitemap y llms.txt', async () => {
  const r = pedir('/__no-existe', 'text/markdown')!;
  assert.equal(r.status, 404);
  assert.equal(r.headers.get('content-type'), 'text/markdown; charset=utf-8');
  const cuerpo = await r.text();
  assert.ok(cuerpo.length >= 20);
  assert.ok(cuerpo.includes(`${URL_SITIO}/sitemap.xml`) && cuerpo.includes(`${URL_SITIO}/llms.txt`));
});

test('HEAD responde sin cuerpo y cada página pública tiene su Markdown', async () => {
  assert.equal(await pedir('/acerca', 'text/markdown', 'HEAD')!.text(), '');
  for (const ruta of ['/', '/login', '/acerca', '/contacto', '/terminos', '/privacidad', '/eliminar-cuenta', '/acerca/']) {
    assert.equal(markdownDe(ruta).estado, 200, ruta);
  }
  assert.equal(markdownDe('/perfil').estado, 200, 'las de sesión explican que requieren sesión');
});

test('las páginas de confianza tienen al menos 500 caracteres', () => {
  for (const ruta of ['/acerca', '/contacto', '/privacidad']) assert.ok(markdownDe(ruta).cuerpo.length >= 500, ruta);
});

test('JSON-LD: Organization con contactPoint y PostalAddress, y WebApplication gratis', () => {
  const grafo = DATOS_ESTRUCTURADOS['@graph'] as Record<string, any>[];
  const org = grafo.find((n) => n['@type'] === 'Organization')!;
  assert.ok(org.contactPoint.email && org.contactPoint.telephone && org.contactPoint.contactType);
  assert.equal(org.address['@type'], 'PostalAddress');
  assert.equal(org.address.addressCountry, 'CO');
  const app = grafo.find((n) => n['@type'] === 'WebApplication')!;
  assert.equal(app.url, URL_SITIO);
  assert.equal(app.offers.price, '0');
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(DATOS_ESTRUCTURADOS)));
});

test('llms.txt sigue el formato (H1, resumen, cuándo usar) y el sitemap lista páginas que existen', () => {
  const llms = readFileSync('public/llms.txt', 'utf8');
  assert.match(llms, /^# USCupo\n\n> /);
  assert.match(llms, /^## Cuándo usar USCupo?$/m);
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');
  for (const [, ruta] of sitemap.matchAll(/<loc>https:\/\/uscupo\.vercel\.app\/([^<]*)<\/loc>/g)) {
    const archivo = ruta === '' ? 'app/index.tsx' : ruta === 'login' ? 'app/(auth)/login.tsx' : `app/${ruta}.tsx`;
    assert.ok(existsSync(archivo), `sitemap: /${ruta} sin página`);
  }
});
