import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CLAVE_RECORDAR, crearAlmacenSesion, DIAS_RECORDAR, type Almacen } from '../src/lib/sesion.ts';

const DIA = 86_400_000;
const TOKEN = 'sb-proyecto-auth-token';

function almacen(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => void datos.set(k, v),
    removeItem: (k) => void datos.delete(k),
    key: (i) => [...datos.keys()][i] ?? null,
    get length() {
      return datos.size;
    },
  };
}

function montar() {
  let reloj = 1_000_000;
  const local = almacen();
  const pestana = almacen();
  const sesion = crearAlmacenSesion(local, pestana, () => reloj);
  return { local, pestana, sesion, avanzar: (ms: number) => (reloj += ms) };
}

test('sin la casilla, la sesión se guarda solo en la pestaña', () => {
  const { local, pestana, sesion } = montar();
  sesion.recordar(false);
  sesion.setItem(TOKEN, 'x');
  assert.equal(pestana.getItem(TOKEN), 'x');
  assert.equal(local.getItem(TOKEN), null);
  assert.equal(sesion.getItem(TOKEN), 'x');
});

test('con la casilla, la sesión va a localStorage y vence a los DIAS_RECORDAR días', () => {
  const { local, pestana, sesion, avanzar } = montar();
  sesion.recordar(true);
  sesion.setItem(TOKEN, 'x');
  assert.equal(local.getItem(TOKEN), 'x');
  assert.equal(pestana.getItem(TOKEN), null);

  avanzar(DIAS_RECORDAR * DIA - 1);
  assert.equal(sesion.getItem(TOKEN), 'x');
  assert.equal(sesion.vencida(), false);

  avanzar(1);
  assert.equal(sesion.getItem(TOKEN), null);
  assert.equal(local.getItem(TOKEN), null);
  assert.equal(local.getItem(CLAVE_RECORDAR), null);
});

test('vencida() avisa una vez y borra lo guardado', () => {
  const { local, sesion, avanzar } = montar();
  sesion.recordar(true);
  sesion.setItem(TOKEN, 'x');
  avanzar(DIAS_RECORDAR * DIA);
  assert.equal(sesion.vencida(), true);
  assert.equal(local.length, 0);
  assert.equal(sesion.vencida(), false);
});

test('una sesión abierta antes de la casilla se conserva DIAS_RECORDAR días', () => {
  const local = almacen();
  local.setItem(TOKEN, 'antigua');
  const sesion = crearAlmacenSesion(local, almacen(), () => 0);
  assert.equal(sesion.getItem(TOKEN), 'antigua');
  assert.equal(local.getItem(CLAVE_RECORDAR), String(DIAS_RECORDAR * DIA));
});

test('removeItem borra en los dos almacenes', () => {
  const { local, pestana, sesion } = montar();
  local.setItem(TOKEN, 'a');
  pestana.setItem(TOKEN, 'b');
  sesion.removeItem(TOKEN);
  assert.equal(local.getItem(TOKEN), null);
  assert.equal(pestana.getItem(TOKEN), null);
});

test('el verificador PKCE va siempre a localStorage: el enlace del correo abre otra pestaña', () => {
  const { local, pestana, sesion } = montar();
  sesion.recordar(false);
  const verificador = 'sb-proyecto-auth-token-code-verifier';
  sesion.setItem(verificador, 'v');
  assert.equal(local.getItem(verificador), 'v');
  assert.equal(pestana.getItem(verificador), null);
  // Otra pestaña (otro sessionStorage, mismo localStorage) lo encuentra.
  assert.equal(crearAlmacenSesion(local, almacen()).getItem(verificador), 'v');
});

test('un verificador pendiente no cuenta como sesión antigua', () => {
  const local = almacen();
  local.setItem('sb-proyecto-auth-token-code-verifier', 'v');
  crearAlmacenSesion(local, almacen(), () => 0);
  assert.equal(local.getItem(CLAVE_RECORDAR), null);
});
