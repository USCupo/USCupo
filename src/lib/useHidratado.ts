import { useSyncExternalStore } from 'react';

const sinSuscripcion = () => () => {};

/**
 * `false` en el render del servidor y en el primer render del navegador (la hidratación), `true`
 * después. Lo que dependa del navegador (tema del sistema, ancho de ventana) espera a `true` para
 * que el HTML del build y el primer render coincidan; si no, React deja estilos del servidor.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false
  );
}
