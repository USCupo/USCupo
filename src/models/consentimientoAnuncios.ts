// Preferencia de anuncios en la web (AdSense usa cookies). Hasta que el visitante elija, los
// anuncios se piden no personalizados; el aviso no bloquea el uso. Se guarda en este navegador.
// Para el tráfico de la UE y el Reino Unido manda el CMP de Google (Privacidad y mensajes de
// AdSense), que se configura en el panel; ver docs/google-ads.md.

export type PreferenciaAnuncios = 'personalizados' | 'no_personalizados';

export const CLAVE_CONSENTIMIENTO = 'uscupo.anuncios';

interface EstadoConsentimiento {
  preferencia: PreferenciaAnuncios | null;
  bannerVisible: boolean;
  noPersonalizados: boolean;
}

/**
 * Lo que pinta el build (sin localStorage) y el primer render del navegador: sin decisión, con el
 * aviso. Si ya había una, el script de app/+html.tsx lo oculta antes de pintar y al hidratar se quita.
 */
export const ESTADO_SIN_DECISION: EstadoConsentimiento = { preferencia: null, bannerVisible: true, noPersonalizados: true };

/** Script en línea del <head>: marca <html data-consentimiento> si ya hay decisión guardada. Su
 * sha256 va en la CSP de vercel.json (tests/consentimientoAnuncios.test.ts lo comprueba). */
export const SCRIPT_CONSENTIMIENTO = `try{var p=localStorage.getItem(${JSON.stringify(CLAVE_CONSENTIMIENTO)});if(p==='personalizados'||p==='no_personalizados')document.documentElement.setAttribute('data-consentimiento','')}catch(e){}`;

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
  // Cerrado sin elegir: se oculta en esta visita y vuelve a preguntar en la próxima.
  let descartado = false;
  let estado = calcular();

  function calcular(): EstadoConsentimiento {
    return {
      preferencia,
      bannerVisible: abiertoAMano || (preferencia === null && !descartado),
      noPersonalizados: preferencia !== 'personalizados',
    };
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
    /** "Cookies y publicidad" en Perfil y en el pie de la web. */
    abrirOpciones() {
      abiertoAMano = true;
      publicar();
    },
    /** Cerrar el aviso; sin elección se queda en no personalizados y no se guarda nada. */
    cerrar() {
      abiertoAMano = false;
      descartado = true;
      publicar();
    },
    alCambiar(f: () => void): () => void {
      oyentes.add(f);
      return () => void oyentes.delete(f);
    },
  };
}

const local = (): Storage | null => (typeof localStorage === 'undefined' ? null : localStorage);

/** El de la app: localStorage del navegador. */
export const consentimientoAnuncios = crearConsentimiento({
  leer: (k) => local()?.getItem(k) ?? null,
  escribir: (k, v) => local()?.setItem(k, v),
});
