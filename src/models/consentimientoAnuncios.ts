// Preferencia de anuncios en la web (AdSense usa cookies). Hasta que el visitante elija, los
// anuncios se piden no personalizados; el aviso no bloquea el uso. Se guarda en este navegador.
// Para el tráfico de la UE y el Reino Unido manda el CMP de Google (Privacidad y mensajes de
// AdSense), que se configura en el panel; ver docs/google-ads.md.

export type PreferenciaAnuncios = 'personalizados' | 'no_personalizados';

export const CLAVE_CONSENTIMIENTO = 'uscupo.anuncios';

export interface EstadoConsentimiento {
  preferencia: PreferenciaAnuncios | null;
  bannerVisible: boolean;
  noPersonalizados: boolean;
}

interface Almacen {
  leer(clave: string): string | null;
  escribir(clave: string, valor: string): void;
}

const esPreferencia = (v: unknown): v is PreferenciaAnuncios => v === 'personalizados' || v === 'no_personalizados';

export function crearConsentimiento(almacen: Almacen) {
  const oyentes = new Set<() => void>();
  let preferencia: PreferenciaAnuncios | null = null;
  try {
    const guardada = almacen.leer(CLAVE_CONSENTIMIENTO);
    if (esPreferencia(guardada)) preferencia = guardada;
  } catch {
    // Almacenamiento bloqueado: se trabaja en memoria.
  }
  let abiertoAMano = false;
  let estado = calcular();

  function calcular(): EstadoConsentimiento {
    return { preferencia, bannerVisible: preferencia === null || abiertoAMano, noPersonalizados: preferencia !== 'personalizados' };
  }
  function publicar() {
    estado = calcular();
    oyentes.forEach((f) => f());
  }

  return {
    /** Misma referencia mientras nada cambie (sirve para useSyncExternalStore). */
    estado: () => estado,
    elegir(p: PreferenciaAnuncios) {
      preferencia = p;
      abiertoAMano = false;
      try {
        almacen.escribir(CLAVE_CONSENTIMIENTO, p);
      } catch {
        // Sin almacenamiento la elección dura lo que dure la página.
      }
      publicar();
    },
    /** "Opciones de privacidad de anuncios" en Perfil. */
    abrirOpciones() {
      abiertoAMano = true;
      publicar();
    },
    /** Cerrar el aviso reabierto; sin elección previa sigue visible. */
    cerrar() {
      abiertoAMano = false;
      publicar();
    },
    alCambiar(f: () => void): () => void {
      oyentes.add(f);
      return () => void oyentes.delete(f);
    },
  };
}

export type Consentimiento = ReturnType<typeof crearConsentimiento>;

const local = (): Storage | null => (typeof localStorage === 'undefined' ? null : localStorage);

/** El de la app: localStorage del navegador. */
export const consentimientoAnuncios = crearConsentimiento({
  leer: (k) => local()?.getItem(k) ?? null,
  escribir: (k, v) => local()?.setItem(k, v),
});
