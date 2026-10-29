import Head from 'expo-router/head';
import type { Metadata } from 'expo-router/server';
import { URL_SITIO } from '../models/informacion';

interface DatosPagina {
  titulo: string;
  descripcion?: string;
  ruta?: string;
}

/**
 * Metadatos del HTML del build (SDK 58: <Head> ya no se escribe en el HTML estático). Cada ruta
 * exporta `generateMetadata = () => metadatos({...})` con los mismos datos que su <MetaPagina>.
 */
export function metadatos({ titulo, descripcion, ruta }: DatosPagina): Metadata {
  return {
    title: `${titulo} · USCupo`,
    ...(descripcion ? { description: descripcion } : {}),
    ...(ruta ? { alternates: { canonical: `${URL_SITIO}${ruta}` } } : { robots: 'noindex, nofollow' }),
  };
}

/**
 * Título de la pestaña y metadatos al navegar dentro de la app (después de hidratar).
 * Las públicas (`ruta`) llevan canonical y descripción; las de sesión o de paso, `noindex`
 * para quedar fuera de los buscadores.
 */
export function MetaPagina({ titulo, descripcion, ruta }: DatosPagina) {
  return (
    <Head>
      <title>{`${titulo} · USCupo`}</title>
      {descripcion ? <meta name="description" content={descripcion} /> : null}
      {ruta ? <link rel="canonical" href={`${URL_SITIO}${ruta}`} /> : <meta name="robots" content="noindex, nofollow" />}
    </Head>
  );
}
