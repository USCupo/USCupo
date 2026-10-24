// Caché del catálogo (CatalogoRepository.kt de Android): carreras, materias y bloques cambian poco.
// Lo guardado sale al instante y se revalida con Supabase una vez por sesión de página y por clave;
// si la revalidación trae algo distinto se avisa para que la pantalla recargue en silencio.

export interface Almacen {
  leer(clave: string): string | null;
  escribir(clave: string, valor: string): void;
  borrar(clave: string): void;
  claves(): string[];
}

const PREFIJO = 'uscupo.catalogo.';

export function crearCacheCatalogo(almacen: Almacen) {
  const revalidados = new Set<string>();
  const oyentes = new Set<() => void>();

  // El almacén puede lanzar (modo privado, cuota llena): eso cuenta como caché vacía.
  const intentar = <R>(f: () => R, siFalla: R): R => {
    try {
      return f();
    } catch {
      return siFalla;
    }
  };

  function leerGuardado<T>(clave: string): T[] | null {
    const crudo = intentar(() => almacen.leer(PREFIJO + clave), null);
    if (!crudo) return null;
    const valor = intentar(() => JSON.parse(crudo) as unknown, null);
    return Array.isArray(valor) && valor.length > 0 ? (valor as T[]) : null;
  }

  async function pedirYGuardar<T>(clave: string, pedir: () => Promise<T[]>): Promise<T[]> {
    const nuevos = await pedir();
    const json = JSON.stringify(nuevos);
    intentar(() => almacen.escribir(PREFIJO + clave, json), undefined);
    revalidados.add(clave);
    return nuevos;
  }

  return {
    async leer<T>(clave: string, pedir: () => Promise<T[]>): Promise<T[]> {
      const cache = leerGuardado<T>(clave);
      if (!cache) return pedirYGuardar(clave, pedir);
      if (!revalidados.has(clave)) {
        revalidados.add(clave);
        pedirYGuardar(clave, pedir)
          .then((nuevos) => {
            if (JSON.stringify(nuevos) !== JSON.stringify(cache)) oyentes.forEach((f) => f());
          })
          // Falló: se queda la caché y se reintenta en la próxima lectura.
          .catch(() => revalidados.delete(clave));
      }
      return cache;
    },

    /** Lo último guardado, sin red (p. ej. buscar una carrera por id). */
    guardado<T>(clave: string): T[] | null {
      return leerGuardado<T>(clave);
    },

    alCambiar(f: () => void): () => void {
      oyentes.add(f);
      return () => void oyentes.delete(f);
    },

    /** Al cerrar sesión o eliminar la cuenta. */
    vaciar() {
      revalidados.clear();
      for (const k of intentar(() => almacen.claves(), [])) {
        if (k.startsWith(PREFIJO)) intentar(() => almacen.borrar(k), undefined);
      }
    },
  };
}

export type CacheCatalogo = ReturnType<typeof crearCacheCatalogo>;

/** localStorage del navegador; sin él (render del servidor, almacenamiento bloqueado) no guarda nada. */
export function almacenLocal(): Almacen {
  const ls = (): Storage | null => (typeof localStorage === 'undefined' ? null : localStorage);
  return {
    leer: (k) => ls()?.getItem(k) ?? null,
    escribir: (k, v) => ls()?.setItem(k, v),
    borrar: (k) => ls()?.removeItem(k),
    claves: () => {
      const s = ls();
      return s ? Array.from({ length: s.length }, (_, i) => s.key(i)).filter((k): k is string => !!k) : [];
    },
  };
}
