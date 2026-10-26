import type { PropsWithChildren } from 'react';
import { SCRIPT_CONSENTIMIENTO } from '../src/models/consentimientoAnuncios';
import { DATOS_ESTRUCTURADOS, LEMA, URL_SITIO } from '../src/models/informacion';

// Plantilla de cada HTML que genera el build (output "static"). El título, la descripción y el
// canonical de cada página los pone MetaPagina; aquí va lo común a todas.
const TITULO = 'USCupo · Cambios de horario entre estudiantes USC';
const DESCRIPCION_OG = `${LEMA} Solo para estudiantes con correo @usc.edu.co.`;
const OG_IMAGEN = `${URL_SITIO}/og-uscupo.png`;

// Reset recomendado por react-native-web; el fondo evita el destello blanco antes del primer pintado.
const RESET = `
html, body { height: 100%; }
body { overflow: hidden; background-color: #0a2959; color: #ffffff; }
#root { display: flex; height: 100%; flex: 1; }
/* Respaldos de src/theme/typography.ts: Arial (Roboto en Android) escalada a las métricas de cada
   fuente web, medidas con fontTools sobre texto en español; así el swap casi no mueve el texto. */
@font-face { font-family: InterRespaldo; src: local('Arial'), local('ArialMT'), local('Helvetica'), local('Roboto'); size-adjust: 105.76%; ascent-override: 91.60%; descent-override: 22.81%; line-gap-override: 0%; }
@font-face { font-family: InterRespaldoBold; src: local('Arial Bold'), local('Arial-BoldMT'), local('Helvetica Bold'), local('Roboto Bold'); size-adjust: 101.57%; ascent-override: 95.38%; descent-override: 23.75%; line-gap-override: 0%; }
@font-face { font-family: PoppinsRespaldo; src: local('Arial Bold'), local('Arial-BoldMT'), local('Helvetica Bold'), local('Roboto Bold'); size-adjust: 105.27%; ascent-override: 99.75%; descent-override: 33.25%; line-gap-override: 9.50%; }
@keyframes uscupo-entrada { from { opacity: 0; transform: translateY(16px); } }
@media (prefers-reduced-motion: no-preference) {
  [data-entrada] { animation: uscupo-entrada 450ms cubic-bezier(0.2, 0, 0, 1) both; }
}
html[data-consentimiento] [data-aviso-cookies="ssr"] { display: none; }
/* El build pinta el layout de teléfono y el tema claro (no conoce ni el ancho ni el tema). Desde
   tablet y con el sistema en oscuro se oculta hasta que RootLayout marca data-hidratado con el
   layout y el tema correctos; así no se ve el salto. Si la hidratación falla, aparece a los 5 s. */
@keyframes uscupo-revelar { to { visibility: visible; } }
@media (min-width: 640px), (prefers-color-scheme: dark) {
  html:not([data-hidratado]) #root { visibility: hidden; animation: uscupo-revelar 0s linear 5s forwards; }
}
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es-CO">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A2959" />
        <meta name="color-scheme" content="light dark" />

        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="USCupo" />
        <meta property="og:locale" content="es_CO" />
        <meta property="og:title" content={TITULO} />
        <meta property="og:description" content={DESCRIPCION_OG} />
        <meta property="og:image" content={OG_IMAGEN} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Logo de USCupo y el texto: ${LEMA}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITULO} />
        <meta name="twitter:description" content={DESCRIPCION_OG} />
        <meta name="twitter:image" content={OG_IMAGEN} />

        <style id="expo-reset" dangerouslySetInnerHTML={{ __html: RESET }} />
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_CONSENTIMIENTO }} />
        {/* Datos, no código: la CSP no aplica a application/ld+json. "<" escapado por si algún texto lo trae. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DATOS_ESTRUCTURADOS).replace(/</g, '\\u003c') }} />
        <noscript>
          <style dangerouslySetInnerHTML={{ __html: '#root { visibility: visible !important; }' }} />
        </noscript>
      </head>
      <body>
        <noscript>Para usar USCupo necesitas activar JavaScript.</noscript>
        {children}
      </body>
    </html>
  );
}
