import assert from 'node:assert/strict';
import { test } from 'node:test';
import { crearCacheCatalogo, type Almacen } from '../src/models/cacheCatalogo.ts';

function almacenEnMemoria(inicial: Record<string, string> = {}): Almacen & { datos: Map<string, string> } {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    leer: (k) => datos.get(k) ?? null,
    escribir: (k, v) => void datos.set(k, v),
    borrar: (k) => void datos.delete(k),
    claves: () => [...datos.keys()],
  };
}

const esperar = () => new Promise((r) => setTimeout(r, 0));

test('sin caché pide al servidor, guarda y devuelve', async () => {
  const a = almacenEnMemoria();
  const cache = crearCacheCatalogo(a);
  const r = await cache.leer('bloques', async () => [1, 2]);
  assert.deepEqual(r, [1, 2]);
  assert.equal(a.datos.get('uscupo.catalogo.bloques'), '[1,2]');
});

test('con caché devuelve al instante y revalida una sola vez por clave', async () => {
  const a = almacenEnMemoria({ 'uscupo.catalogo.bloques': '[1]' });
  const cache = crearCacheCatalogo(a);
  let pedidos = 0;
  const pedir = async () => (++pedidos, [1, 2]);

  assert.deepEqual(await cache.leer('bloques', pedir), [1]);
  await esperar();
  assert.equal(pedidos, 1);
  assert.deepEqual(await cache.leer('bloques', pedir), [1, 2]);
  await esperar();
  assert.equal(pedidos, 1);
});

test('avisa cuando la revalidación trae datos distintos', async () => {
  const a = almacenEnMemoria({ 'uscupo.catalogo.bloques': '[1]', 'uscupo.catalogo.carreras': '[9]' });
  const cache = crearCacheCatalogo(a);
  let avisos = 0;
  cache.alCambiar(() => avisos++);
  await cache.leer('bloques', async () => [1, 2]);
  await cache.leer('carreras', async () => [9]);
  await esperar();
  assert.equal(avisos, 1);
});

test('si el servidor falla y no hay caché, lanza el error', async () => {
  const cache = crearCacheCatalogo(almacenEnMemoria());
  await assert.rejects(cache.leer('bloques', async () => Promise.reject(new Error('sin red'))), /sin red/);
});

test('si la revalidación falla se queda con la caché y lo reintenta luego', async () => {
  const a = almacenEnMemoria({ 'uscupo.catalogo.bloques': '[1]' });
  const cache = crearCacheCatalogo(a);
  let pedidos = 0;
  await cache.leer('bloques', async () => (++pedidos, Promise.reject(new Error('x'))));
  await esperar();
  assert.equal(a.datos.get('uscupo.catalogo.bloques'), '[1]');
  await cache.leer('bloques', async () => (++pedidos, [3]));
  await esperar();
  assert.equal(pedidos, 2);
});

test('una caché ilegible o un almacén que lanza cuentan como vacíos', async () => {
  const roto: Almacen = {
    leer: () => {
      throw new Error('bloqueado');
    },
    escribir: () => {
      throw new Error('lleno');
    },
    borrar: () => {},
    claves: () => [],
  };
  assert.deepEqual(await crearCacheCatalogo(roto).leer('bloques', async () => [7]), [7]);
  const a = almacenEnMemoria({ 'uscupo.catalogo.bloques': '{no es json' });
  assert.deepEqual(await crearCacheCatalogo(a).leer('bloques', async () => [8]), [8]);
});

test('vaciar borra solo las claves del catálogo y olvida lo revalidado', async () => {
  const a = almacenEnMemoria({ 'uscupo.catalogo.bloques': '[1]', 'uscupo.tema': 'oscuro' });
  const cache = crearCacheCatalogo(a);
  await cache.leer('bloques', async () => [1]);
  cache.vaciar();
  assert.deepEqual([...a.datos.keys()], ['uscupo.tema']);
  let pedidos = 0;
  await cache.leer('bloques', async () => (++pedidos, [2]));
  assert.equal(pedidos, 1);
});

test('con avisar: false la revalidación actualiza la caché pero no avisa', async () => {
  const a = almacenEnMemoria({ 'uscupo.catalogo.bloques': '[1]' });
  const cache = crearCacheCatalogo(a);
  let avisos = 0;
  cache.alCambiar(() => avisos++);
  await cache.leer('bloques', async () => [1, 2], { avisar: false });
  await esperar();
  assert.equal(avisos, 0);
  assert.equal(a.datos.get('uscupo.catalogo.bloques'), '[1,2]');
});

test('una revalidación que termina después de vaciar no vuelve a guardar ni avisa', async () => {
  const a = almacenEnMemoria({ 'uscupo.catalogo.materias-1': '[1]' });
  const cache = crearCacheCatalogo(a);
  let avisos = 0;
  cache.alCambiar(() => avisos++);
  let soltar!: (v: number[]) => void;
  await cache.leer('materias-1', () => new Promise<number[]>((r) => (soltar = r)));
  cache.vaciar();
  soltar([1, 2]);
  await esperar();
  assert.equal(a.datos.has('uscupo.catalogo.materias-1'), false);
  assert.equal(avisos, 0);
  // La próxima sesión revalida de nuevo.
  let pedidos = 0;
  a.datos.set('uscupo.catalogo.materias-1', '[1]');
  await cache.leer('materias-1', async () => (++pedidos, [1]));
  await esperar();
  assert.equal(pedidos, 1);
});

test('una carga sin caché que termina después de vaciar no se guarda', async () => {
  const a = almacenEnMemoria();
  const cache = crearCacheCatalogo(a);
  let soltar!: (v: number[]) => void;
  const p = cache.leer('carreras', () => new Promise<number[]>((r) => (soltar = r)));
  cache.vaciar();
  soltar([7]);
  assert.deepEqual(await p, [7]);
  assert.equal(a.datos.has('uscupo.catalogo.carreras'), false);
});
