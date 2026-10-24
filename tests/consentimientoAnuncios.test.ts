import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLAVE_CONSENTIMIENTO, crearConsentimiento } from '../src/models/consentimientoAnuncios.ts';

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

test('cerrar sin haber elegido no oculta el banner', () => {
  const c = crearConsentimiento(almacen());
  c.cerrar();
  assert.equal(c.estado().bannerVisible, true);
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
