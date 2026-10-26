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
