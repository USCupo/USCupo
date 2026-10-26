// Qué es USCupo, en texto: lo usan la página /acerca, /contacto, el inicio sin sesión, el
// Markdown para agentes (src/lib/markdown.ts) y los datos estructurados (app/+html.tsx).
// Solo datos: middleware.ts también lo importa.
import { AVISO_NO_OFICIAL, RESPONSABLE, type Documento } from './legal.ts';

export const URL_SITIO = 'https://www.uscupo.com';
export const DOMINIO_USC = 'usc.edu.co';

export const LEMA = 'Encuentra a alguien que quiera tu horario y te dé el suyo.';

export const DESCRIPCION_PRODUCTO =
  'USCupo es una bolsa de intercambio de cupos para estudiantes de la Universidad Santiago de Cali (USC). ' +
  'Si tienes un grupo de una materia y necesitas otro horario, publicas lo que tienes y lo que buscas; ' +
  'otro estudiante que quiera tu grupo te da el suyo. Es gratis y solo entra quien tiene correo @' +
  DOMINIO_USC +
  '.';

export const PASOS = [
  'Publicas el grupo que tienes y el horario que buscas.',
  'Otro estudiante muestra interés y ambos ven sus datos de contacto.',
  'Hacen el cambio por los canales oficiales de la USC.',
];

/** Lo que distingue a USCupo; la portada pública lo muestra en tarjetas. */
export const VENTAJAS = [
  {
    titulo: 'Solo estudiantes de la USC',
    texto: `Para entrar hace falta un correo @${DOMINIO_USC} confirmado, así que del otro lado siempre hay un compañero de la Universidad.`,
  },
  {
    titulo: 'Cambios exactos, no listas eternas',
    texto: 'Te mostramos primero a quien tiene el horario que buscas y, además, busca el tuyo. Si no hay uno exacto, puedes revisar todas las ofertas de tu carrera.',
  },
  {
    titulo: 'Tu contacto, solo cuando hace falta',
    texto: 'Tu correo o tu WhatsApp aparecen únicamente para el estudiante que marcó interés en tu oferta, y tú decides cuál de los dos mostrar.',
  },
  {
    titulo: 'Gratis y sin intermediarios',
    texto: 'No cobramos por publicar ni por contactar. USCupo se sostiene con anuncios y no participa en el cambio: lo hacen ustedes dos.',
  },
];

/** Recomendaciones para que el cambio salga bien; van en la portada y en Preguntas frecuentes. */
export const CONSEJOS = [
  'Antes de publicar, revisa en el calendario académico de la USC las fechas en que se permiten los cambios de grupo.',
  'Pon el grupo exacto y todos los horarios que te sirven: así aparecen más coincidencias.',
  'Cuando alguien marque interés, escríbele pronto: la oferta queda reservada solo 7 días.',
  'Acuerden el cambio y háganlo por los canales oficiales de la USC; nadie debe pedirte dinero ni tus contraseñas.',
  'Si una oferta o un estudiante no se comporta bien, repórtalo o bloquéalo desde la misma oferta.',
];

export const PREGUNTAS: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿USCupo es de la Universidad Santiago de Cali?',
    respuesta: `No. ${AVISO_NO_OFICIAL} Lo hace un estudiante para estudiantes.`,
  },
  {
    pregunta: '¿Cuánto cuesta?',
    respuesta: 'Nada. Publicar, buscar y contactar es gratis. El proyecto se financia con anuncios de Google AdSense.',
  },
  {
    pregunta: '¿Quién puede usarlo?',
    respuesta: `Cualquier estudiante de la USC con correo institucional @${DOMINIO_USC}, de cualquier carrera. Puedes entrar con tu cuenta de Microsoft de la USC o con tu correo y una contraseña.`,
  },
  {
    pregunta: '¿USCupo me cambia el grupo en el sistema de la Universidad?',
    respuesta: 'No. USCupo pone en contacto a dos estudiantes que quieren intercambiar grupos. El cambio lo hacen después ustedes por los canales oficiales de la USC.',
  },
  {
    pregunta: '¿Cómo funciona un cambio?',
    respuesta: 'Publicas la materia, el grupo que tienes y los horarios que buscas. Cuando otro estudiante marca interés, la oferta queda en proceso y ambos ven el contacto del otro. Si en 7 días nadie confirma el cambio, la oferta vence y te avisamos.',
  },
  {
    pregunta: '¿Quién ve mis datos de contacto?',
    respuesta: 'Solo el estudiante que marca interés en tu oferta, o aquel en cuya oferta marcas interés tú. En tu perfil eliges si mostrar tu correo, tu WhatsApp o los dos.',
  },
  {
    pregunta: '¿Qué hago cuando ya hicimos el cambio?',
    respuesta: 'Confírmalo en Mis cambios. La oferta deja de aparecer en las búsquedas y queda en tu historial.',
  },
  {
    pregunta: '¿Puedo reportar o bloquear a alguien?',
    respuesta: 'Sí. Cada oferta tiene la opción de reportarla o de bloquear a quien la publicó. Los reportes los revisa el equipo de USCupo.',
  },
  {
    pregunta: 'Olvidé mi contraseña, ¿qué hago?',
    respuesta: 'En la pantalla de inicio de sesión toca "¿Olvidaste tu contraseña?" y te enviamos un enlace para crear una nueva. Si entras con Microsoft, tu contraseña es la de la USC.',
  },
  {
    pregunta: '¿Cómo elimino mi cuenta?',
    respuesta: 'Desde Perfil → Eliminar cuenta, o siguiendo los pasos de la página Eliminar cuenta. Se borran tu perfil, tus ofertas y tus datos de contacto.',
  },
];

export const PREGUNTAS_FRECUENTES: Documento = {
  titulo: 'Preguntas frecuentes',
  resumen: 'Respuestas sobre cómo funciona USCupo, quién puede usarlo y cómo cuidamos tus datos.',
  secciones: [
    ...PREGUNTAS.map((p) => ({ titulo: p.pregunta, bloques: [p.respuesta] })),
    { titulo: 'Consejos para un cambio seguro', bloques: [{ lista: CONSEJOS }] },
  ],
};

export const ACERCA: Documento = {
  titulo: 'Acerca de USCupo',
  resumen: 'Qué es USCupo, para quién es y quién lo hace.',
  secciones: [
    { titulo: 'Qué es', bloques: [DESCRIPCION_PRODUCTO] },
    { titulo: 'Cómo funciona', bloques: [{ lista: PASOS }] },
    {
      titulo: 'Para quién es',
      bloques: [
        `Para estudiantes de la USC con correo institucional @${DOMINIO_USC}, en cualquier carrera. Al registrarte eliges tu carrera y ves las ofertas de las materias que te interesan.`,
        'USCupo no inscribe materias ni cambia grupos en el sistema de la Universidad: solo pone en contacto a dos estudiantes que quieren cambiar. El cambio se hace después por los canales oficiales de la USC.',
      ],
    },
    {
      titulo: 'Quién lo hace',
      bloques: [
        `${AVISO_NO_OFICIAL} Lo desarrolla y mantiene ${RESPONSABLE.nombre}, en ${RESPONSABLE.ciudad}. Se financia con anuncios de Google AdSense.`,
      ],
    },
  ],
};

export const CONTACTO: Documento = {
  titulo: 'Contacto',
  resumen: 'Cómo escribirnos para dudas, reportes o el ejercicio de tus derechos sobre tus datos.',
  secciones: [
    {
      titulo: 'Responsable',
      bloques: [
        `${RESPONSABLE.nombre}, responsable del tratamiento de datos de USCupo, en ${RESPONSABLE.ciudad}.`,
        { lista: [`Correo: ${RESPONSABLE.correo}`, `Teléfono: ${RESPONSABLE.telefono}`] },
      ],
    },
    {
      titulo: 'Para qué escribirnos',
      bloques: [
        {
          lista: [
            'Dudas sobre cómo funciona USCupo o problemas para entrar con tu correo @' + DOMINIO_USC + '.',
            'Reportar una oferta o un estudiante (también puedes hacerlo desde la app, en cada oferta).',
            'Consultar, actualizar o eliminar tus datos personales, conforme a la Ley 1581 de 2012.',
          ],
        },
        'Sobre tus datos personales respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15. Para eliminar tu cuenta tienes también la página Eliminar cuenta.',
      ],
    },
    {
      titulo: 'Lo que no hacemos',
      bloques: [
        `${AVISO_NO_OFICIAL} Para inscripciones, cupos o cambios de grupo en el sistema académico, escribe a la USC por sus canales oficiales.`,
      ],
    },
  ],
};

/** JSON-LD (schema.org) del sitio: la organización y la app web. Va en el <head> de cada página. */
export const DATOS_ESTRUCTURADOS = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${URL_SITIO}/#organizacion`,
      name: 'USCupo',
      url: URL_SITIO,
      logo: `${URL_SITIO}/icon-512.png`,
      description: AVISO_NO_OFICIAL,
      email: RESPONSABLE.correo,
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: RESPONSABLE.correo,
        telephone: '+57 ' + RESPONSABLE.telefono,
        availableLanguage: 'es',
        url: `${URL_SITIO}/contacto`,
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Cali',
        addressRegion: 'Valle del Cauca',
        addressCountry: 'CO',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': `${URL_SITIO}/#app`,
      name: 'USCupo',
      url: URL_SITIO,
      description: DESCRIPCION_PRODUCTO,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      inLanguage: 'es-CO',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'COP' },
      audience: { '@type': 'EducationalAudience', educationalRole: 'student' },
      publisher: { '@id': `${URL_SITIO}/#organizacion` },
    },
  ],
};
