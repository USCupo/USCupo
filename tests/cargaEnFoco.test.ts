import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Cargador, VIGENCIA_MS } from '../src/controllers/cargador.ts';

function diferido<T>() {
  let resolver!: (v: T) => void;
  let rechazar!: (e: unknown) => void;
  const promesa = new Promise<T>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
}

function montar() {
  let reloj = 0;
  const pedidos: ReturnType<typeof diferido<string>>[] = [];
  const estados: { datos: string | null; cargando: boolean; error: string | null }[] = [];
  const c = new Cargador<string>({
    cargar: () => {
      const d = diferido<string>();
      pedidos.push(d);
      return d.promesa;
    },
    alCambiar: (e) => estados.push(e),
    ahora: () => reloj,
    mensajeDeError: (e) => String(e),
  });
  return { c, pedidos, estados, avanzar: (ms: number) => (reloj += ms), ultimo: () => estados.at(-1)! };
}

test('el primer foco pide y muestra los datos', async () => {
  const m = montar();
  m.c.alFoco();
  assert.equal(m.pedidos.length, 1);
  m.pedidos[0].resolver('a');
  await m.c.enCurso;
  assert.deepEqual(m.ultimo(), { datos: 'a', cargando: false, error: null });
});

test('un foco con datos de menos de 15 s no pide nada', async () => {
  const m = montar();
  m.c.alFoco();
  m.pedidos[0].resolver('a');
  await m.c.enCurso;
  m.avanzar(VIGENCIA_MS - 1);
  m.c.alFoco();
  assert.equal(m.pedidos.length, 1);
  m.avanzar(1);
  m.c.alFoco();
  assert.equal(m.pedidos.length, 2);
});

test('un foco con una carga en curso no la reinicia', () => {
  const m = montar();
  m.c.alFoco();
  m.c.alFoco();
  assert.equal(m.pedidos.length, 1);
});

test('un foco tras un error vuelve a pedir aunque sea pronto', async () => {
  const m = montar();
  m.c.alFoco();
  m.pedidos[0].resolver('a');
  await m.c.enCurso;
  m.c.recargar();
  m.pedidos[1].rechazar('sin red');
  await m.c.enCurso;
  assert.equal(m.ultimo().error, 'sin red');
  assert.equal(m.ultimo().datos, 'a');
  m.c.alFoco();
  assert.equal(m.pedidos.length, 3);
});

test('recargar siempre pide, aunque los datos sean recientes', async () => {
  const m = montar();
  m.c.alFoco();
  m.pedidos[0].resolver('a');
  await m.c.enCurso;
  m.c.recargar();
  assert.equal(m.pedidos.length, 2);
});

test('si dos cargas se cruzan gana la más reciente', async () => {
  const m = montar();
  m.c.alFoco();
  const segunda = m.c.recargar();
  m.pedidos[1].resolver('nueva');
  await segunda;
  m.pedidos[0].resolver('vieja');
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(m.ultimo().datos, 'nueva');
});

test('las recargas con datos no vuelven a mostrar "cargando"', async () => {
  const m = montar();
  m.c.alFoco();
  m.pedidos[0].resolver('a');
  await m.c.enCurso;
  m.c.recargar();
  assert.ok(m.estados.every((e, i) => i === 0 || !e.cargando || e.datos === null));
  assert.equal(m.ultimo().cargando, false);
});
