// Vercel Routing Middleware: con `Accept: text/markdown` responde la versión Markdown de la página
// (src/lib/markdown.ts); cualquier otra petición sigue igual hacia el HTML estático.
import { responderMarkdown } from './src/lib/markdown.ts';

export const config = {
  runtime: 'nodejs',
  // Solo páginas (fuera bundles, assets y archivos con extensión) y solo si piden Markdown: a un
  // navegador normal no le cuesta una invocación. El 404 en Markdown sale de la misma regla.
  matcher: [
    {
      source: '/((?!_expo/|assets/|.*\\.[a-zA-Z0-9]+$).*)',
      has: [{ type: 'header', key: 'accept', value: '.*text/markdown.*' }],
    },
  ],
};

export default function middleware(request: Request): Response | undefined {
  return responderMarkdown(request) ?? undefined;
}
