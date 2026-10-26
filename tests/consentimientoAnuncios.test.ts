import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  CLAVE_CONSENTIMIENTO,
  crearConsentimiento,
  ESTADO_SIN_DECISION,
  SCRIPT_CONSENTIMIENTO,
} from '../src/models/consentimientoAnuncios.ts';

function almacen(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  return { datos, leer: (k: string) => datos.get(k) ?? null, escribir: (k: string, v: string) => void datos.set(k, v) };
}

test('sin elección el banner se muestra y los anuncios no son personalizados', () => {
  const c = crearConsentimiento(almacen());
  assert.deepEqual(c.estado(), { preferencia: null, bannerVisible: true, noPersonalizados: true });
});

test('elegir guarda la preferencia, cierra el banner y avisa', () => {
  const a = almacen();
  const c = crearConsentimiento(a);
  let avisos = 0;
  c.alCambiar(() => avisos++);
  c.elegir('personalizados');
  assert.deepEqual(c.estado(), { preferencia: 'personalizados', bannerVisible: false, noPersonalizados: false });
  assert.equal(a.datos.get(CLAVE_CONSENTIMIENTO), 'personalizados');
  assert.equal(avisos, 1);
});

test('una elección guardada se respeta al volver', () => {
  const c = crearConsentimiento(almacen({ [CLAVE_CONSENTIMIENTO]: 'no_personalizados' }));
  assert.deepEqual(c.estado(), { preferencia: 'no_personalizados', bannerVisible: false, noPersonalizados: true });
});

test('un valor guardado desconocido cuenta como sin elección', () => {
  const c = crearConsentimiento(almacen({ [CLAVE_CONSENTIMIENTO]: 'quizas' }));
  assert.equal(c.estado().preferencia, null);
  assert.equal(c.estado().bannerVisible, true);
});

test('abrir opciones vuelve a mostrar el banner sin perder la elección', () => {
  const c = crearConsentimiento(almacen({ [CLAVE_CONSENTIMIENTO]: 'personalizados' }));
  c.abrirOpciones();
  assert.deepEqual(c.estado(), { preferencia: 'personalizados', bannerVisible: true, noPersonalizados: false });
  c.cerrar();
  assert.equal(c.estado().bannerVisible, false);
});

test('cerrar sin haber elegido lo oculta en esta visita, sin guardar nada', () => {
  const a = almacen();
  const c = crearConsentimiento(a);
  c.cerrar();
  assert.deepEqual(c.estado(), { preferencia: null, bannerVisible: false, noPersonalizados: true });
  assert.equal(a.datos.has(CLAVE_CONSENTIMIENTO), false);
  // En la próxima visita vuelve a preguntar.
  assert.equal(crearConsentimiento(a).estado().bannerVisible, true);
});

test('sin almacenamiento (modo privado) funciona en memoria', () => {
  const roto = {
    leer: () => {
      throw new Error('bloqueado');
    },
    escribir: () => {
      throw new Error('bloqueado');
    },
  };
  const c = crearConsentimiento(roto);
  assert.equal(c.estado().preferencia, null);
  c.elegir('no_personalizados');
  assert.equal(c.estado().preferencia, 'no_personalizados');
  assert.equal(c.estado().bannerVisible, false);
});

/** Corre el script del <head> con un localStorage y un <html> de mentira; devuelve si marcó. */
function correrScript(guardado: string | null, falla = false): boolean {
  const attrs = new Set<string>();
  const localStorage = {
    getItem: (k: string) => {
      if (falla) throw new Error('bloqueado');
      return k === CLAVE_CONSENTIMIENTO ? guardado : null;
    },
  };
  const document = { documentElement: { setAttribute: (n: string) => void attrs.add(n) } };
  new Function('localStorage', 'document', SCRIPT_CONSENTIMIENTO)(localStorage, document);
  return attrs.has('data-consentimiento');
}

test('el script del <head> marca <html> solo si hay una decisión válida guardada', () => {
  assert.equal(correrScript('personalizados'), true);
  assert.equal(correrScript('no_personalizados'), true);
  assert.equal(correrScript(null), false);
  assert.equal(correrScript('otra-cosa'), false);
  assert.equal(correrScript(null, true), false, 'almacenamiento bloqueado: no rompe ni marca');
});

test('la CSP de vercel.json permite el script del <head> por su sha256', () => {
  const hash = createHash('sha256').update(SCRIPT_CONSENTIMIENTO).digest('base64');
  const csp = JSON.parse(readFileSync('vercel.json', 'utf8'))
    .headers.flatMap((h: { headers: { key: string; value: string }[] }) => h.headers)
    .find((h: { key: string }) => h.key === 'Content-Security-Policy').value as string;
  const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'))!;
  assert.ok(scriptSrc.includes(`'sha256-${hash}'`), `Falta 'sha256-${hash}' en script-src`);
  assert.ok(!scriptSrc.includes("'unsafe-inline'"));
});

test('el estado del build es sin decisión, con el aviso visible', () => {
  assert.deepEqual(ESTADO_SIN_DECISION, { preferencia: null, bannerVisible: true, noPersonalizados: true });
});
