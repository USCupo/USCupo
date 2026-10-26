// Vercel Routing Middleware: con `Accept: text/markdown` responde la versión Markdown de la página
// (src/lib/markdown.ts); cualquier otra petición sigue igual hacia el HTML estático.
import { responderMarkdown } from './src/lib/markdown.ts';

export const config = {
  runtime: 'nodejs',
  // Solo páginas: fuera los bundles, los assets y cualquier archivo con extensión. (Vercel solo
  // acepta rutas aquí, no condiciones por cabecera: la de Accept la decide responderMarkdown.)
  matcher: ['/((?!_expo/|assets/|.*\\.[a-zA-Z0-9]+$).*)'],
};

export default function middleware(request: Request): Response | undefined {
  return responderMarkdown(request) ?? undefined;
}
