import { useSyncExternalStore } from 'react';

// Alto del FooterWeb fijo (Login de computador), para que el aviso de cookies flote encima
// aunque el pie se parta en dos filas. 0 = no hay pie fijo en pantalla.
let alto = 0;
const oyentes = new Set<() => void>();

export function avisarAltoFooterFijo(h: number) {
  if (h === alto) return;
  alto = h;
  oyentes.forEach((f) => f());
}

export function useAltoFooterFijo(): number {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => void oyentes.delete(f);
    },
    () => alto,
    () => alto
  );
}
