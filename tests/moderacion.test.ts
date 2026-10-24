import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ESTADO_INICIAL,
  MAX_DETALLE,
  MOTIVOS_REPORTE,
  validarConfirmacion,
  transiciones as t,
} from '../src/controllers/estadoModeracion.ts';

const oferta = { id: 7, materia: { nombre: 'Cálculo' } };

test('los motivos y sus claves coinciden con la RPC y con Android', () => {
  assert.deepEqual(
    MOTIVOS_REPORTE.map((m) => [m.clave, m.etiqueta]),
    [
      ['ofensivo', 'Contenido ofensivo o acoso'],
      ['datos_personales', 'Comparte datos personales'],
      ['spam', 'Spam o publicidad'],
      ['falso', 'Oferta falsa o engañosa'],
      ['otro', 'Otro motivo'],
    ]
  );
});

test('pedir un reporte abre el diálogo limpio y cierra el de bloqueo', () => {
  const s = t.pedirReporte({ ...ESTADO_INICIAL, bloqueando: { usuarioId: 'u', nombre: 'Ana' }, detalle: 'viejo' }, oferta);
  assert.equal(s.reportando, oferta);
  assert.equal(s.bloqueando, null);
  assert.equal(s.motivo, null);
  assert.equal(s.detalle, '');
});

test('mientras se envía no se abre ni se cierra nada', () => {
  const enviando = { ...ESTADO_INICIAL, reportando: oferta, enviando: true };
  assert.equal(t.pedirBloqueo(enviando, 'u', 'Ana'), enviando);
  assert.equal(t.cancelar(enviando), enviando);
});

test('el detalle se corta a 500 caracteres', () => {
  assert.equal(t.setDetalle(ESTADO_INICIAL, 'x'.repeat(600)).detalle.length, MAX_DETALLE);
});

test('confirmar un reporte sin motivo pide elegir uno', () => {
  assert.equal(validarConfirmacion({ ...ESTADO_INICIAL, reportando: oferta }), 'Elige un motivo.');
  assert.equal(validarConfirmacion({ ...ESTADO_INICIAL, reportando: oferta, motivo: 'spam' }), null);
  assert.equal(validarConfirmacion({ ...ESTADO_INICIAL, bloqueando: { usuarioId: 'u', nombre: 'Ana' } }), null);
});

test('los avisos de éxito son los mismos que en Android', () => {
  assert.equal(
    t.exito({ ...ESTADO_INICIAL, reportando: oferta, motivo: 'spam' }).aviso,
    'Gracias por avisar. Revisaremos la oferta y ya no la verás.'
  );
  assert.equal(
    t.exito({ ...ESTADO_INICIAL, bloqueando: { usuarioId: 'u', nombre: 'Ana' } }).aviso,
    'Bloqueaste a Ana. Ya no verán sus ofertas entre ustedes.'
  );
});
