import Head from 'expo-router/head';
import { useEffect } from 'react';

export const URL_SITIO = 'https://uscupo.vercel.app';

/**
 * Título de la pestaña y metadatos de la página. Las públicas (`ruta`) llevan canonical y
 * descripción; las de sesión o de paso, `noindex` para quedar fuera de los buscadores.
 */
export function MetaPagina({ titulo, descripcion, ruta }: { titulo: string; descripcion?: string; ruta?: string }) {
  // public/index.html trae una descripción genérica para quien no ejecuta JS; si la página tiene
  // la suya, se quita la de la plantilla (Head solo gestiona las que crea, con data-rh).
  useEffect(() => {
    if (!descripcion || typeof document === 'undefined') return;
    document.querySelectorAll('meta[name="description"]:not([data-rh])').forEach((m) => m.remove());
  }, [descripcion]);

  return (
    <Head>
      <title>{`${titulo} · USCupo`}</title>
      {descripcion ? <meta name="description" content={descripcion} /> : null}
      {ruta ? <link rel="canonical" href={`${URL_SITIO}${ruta}`} /> : <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
}
