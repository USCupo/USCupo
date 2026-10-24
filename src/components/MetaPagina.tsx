import Head from 'expo-router/head';

export const URL_SITIO = 'https://uscupo.vercel.app';

/**
 * Título de la pestaña y metadatos de la página. Las públicas (`ruta`) llevan canonical y
 * descripción; las de sesión o de paso, `noindex` para quedar fuera de los buscadores.
 */
export function MetaPagina({ titulo, descripcion, ruta }: { titulo: string; descripcion?: string; ruta?: string }) {
  return (
    <Head>
      <title>{`${titulo} · USCupo`}</title>
      {descripcion ? <meta name="description" content={descripcion} /> : null}
      {ruta ? <link rel="canonical" href={`${URL_SITIO}${ruta}`} /> : <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
}
