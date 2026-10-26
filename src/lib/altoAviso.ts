import { useSyncExternalStore } from 'react';

// Alto del aviso de cookies flotante (0 = no está en pantalla). FooterWeb deja ese espacio debajo
// para que, al bajar hasta el final, el aviso no tape el pie.
let alto = 0;
const oyentes = new Set<() => void>();

export function avisarAltoAviso(h: number) {
  if (h === alto) return;
  alto = h;
  oyentes.forEach((f) => f());
}

export function useAltoAviso(): number {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => void oyentes.delete(f);
    },
    () => alto,
    () => 0
  );
}
