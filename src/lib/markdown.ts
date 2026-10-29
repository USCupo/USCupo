// Versión Markdown de las páginas públicas para agentes (negociación por Accept: text/markdown,
// https://acceptmarkdown.com). La usa middleware.ts. Solo datos y texto: nada de React Native.
import { ACERCA, CONSEJOS, CONTACTO, PREGUNTAS, PREGUNTAS_FRECUENTES, DESCRIPCION_PRODUCTO, LEMA, PASOS, URL_SITIO } from '../models/informacion.ts';
import { AVISO_NO_OFICIAL, ELIMINAR_CUENTA, PRIVACIDAD, TERMINOS, VIGENTE_DESDE, type Documento } from '../models/legal.ts';

const ENLACES = `## Enlaces

- [Inicio](${URL_SITIO}/)
- [Ingresar o crear cuenta](${URL_SITIO}/login)
- [Acerca de USCupo](${URL_SITIO}/acerca)
- [Contacto](${URL_SITIO}/contacto)
- [Términos de uso](${URL_SITIO}/terminos)
- [Política de privacidad](${URL_SITIO}/privacidad)
- [Eliminar cuenta](${URL_SITIO}/eliminar-cuenta)
- [llms.txt](${URL_SITIO}/llms.txt)
- [Sitemap](${URL_SITIO}/sitemap.xml)
`;

function documento(doc: Documento, vigencia: boolean): string {
  const partes = [`# ${doc.titulo}`, '', `${doc.resumen}${vigencia ? ` Vigente desde el ${VIGENTE_DESDE}.` : ''}`];
  for (const s of doc.secciones) {
    partes.push('', `## ${s.titulo}`, '');
    for (const b of s.bloques) partes.push(typeof b === 'string' ? `${b}\n` : `${b.lista.map((i) => `- ${i}`).join('\n')}\n`);
  }
  return `${partes.join('\n').trim()}\n\n${ENLACES}`;
}

const INICIO = `# USCupo: cambios de horario entre estudiantes USC

${LEMA}

${DESCRIPCION_PRODUCTO}

## Cómo funciona

${PASOS.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Para usarlo hay que [ingresar o crear una cuenta](${URL_SITIO}/login) con un correo @usc.edu.co.

## Preguntas frecuentes

${PREGUNTAS.map((p) => `**${p.pregunta}**\n${p.respuesta}`).join('\n\n')}

## Consejos para un cambio seguro

${CONSEJOS.map((c) => `- ${c}`).join('\n')}

${AVISO_NO_OFICIAL}

${ENLACES}`;

const CON_SESION = `# Esta página requiere sesión

Esta parte de USCupo solo la ven estudiantes con sesión iniciada. Para entrar, [ingresa con tu correo @usc.edu.co](${URL_SITIO}/login).

${ENLACES}`;

const RECUPERAR = `# Recuperar la contraseña

Si olvidaste tu contraseña de USCupo, abre [recuperar la contraseña](${URL_SITIO}/recuperar) en un navegador y escribe tu correo @usc.edu.co: te llega un enlace para crear una nueva. Las cuentas que entran con Microsoft usan la contraseña de la USC.

${ENLACES}`;

const MARKDOWN_404 = `# Página no encontrada

La dirección que pediste no existe en USCupo. Revisa el [sitemap](${URL_SITIO}/sitemap.xml), el [llms.txt](${URL_SITIO}/llms.txt) o vuelve al [inicio](${URL_SITIO}/).

${ENLACES}`;

const PAGINAS: Record<string, string> = {
  '/': INICIO,
  '/login': INICIO,
  '/acerca': documento(ACERCA, false),
  '/contacto': documento(CONTACTO, false),
  '/preguntas': documento(PREGUNTAS_FRECUENTES, false),
  '/terminos': documento(TERMINOS, true),
  '/privacidad': documento(PRIVACIDAD, true),
  '/eliminar-cuenta': documento(ELIMINAR_CUENTA, true),
  '/recuperar': RECUPERAR,
  '/restablecer': RECUPERAR,
};

const RUTAS_CON_SESION = ['/buscar', '/publicar', '/mis-cambios', '/perfil', '/aceptar-legal', '/completar-perfil', '/auth/callback'];

/** ¿Pide Markdown? Sí si Accept trae text/markdown con q > 0. */
export function pideMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  return accept.split(',').some((parte) => {
    const [tipo, ...params] = parte.trim().toLowerCase().split(';');
    if (tipo.trim() !== 'text/markdown') return false;
    const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    return !q || Number(q.slice(2)) > 0;
  });
}

/** Markdown y estado HTTP para una ruta (sin barra final; la raíz es "/"). */
export function markdownDe(ruta: string): { cuerpo: string; estado: number } {
  const limpia = ruta.length > 1 ? ruta.replace(/\/+$/, '') : ruta;
  if (PAGINAS[limpia]) return { cuerpo: PAGINAS[limpia], estado: 200 };
  if (RUTAS_CON_SESION.includes(limpia)) return { cuerpo: CON_SESION, estado: 200 };
  return { cuerpo: MARKDOWN_404, estado: 404 };
}

/** Respuesta Markdown si la petición la pide; si no, null (sigue el HTML de siempre). */
export function responderMarkdown(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  if (!pideMarkdown(request.headers.get('accept'))) return null;
  const { cuerpo, estado } = markdownDe(new URL(request.url).pathname);
  return new Response(request.method === 'HEAD' ? null : cuerpo, {
    status: estado,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Vary: 'Accept',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      Link: `<${URL_SITIO}/llms.txt>; rel="describedby"`,
    },
  });
}
