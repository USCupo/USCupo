import Head from 'expo-router/head';
import { URL_SITIO } from '../models/informacion';

/**
 * Título de la pestaña y metadatos de la página; el build los escribe en el HTML de cada ruta.
 * Las públicas (`ruta`) llevan canonical y descripción; las de sesión o de paso, `noindex`
 * para quedar fuera de los buscadores.
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
