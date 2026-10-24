// Textos legales de USCupo (web y apps). La app Android enlaza a estas mismas páginas.
// Al cambiar cualquiera de los dos documentos se sube VERSION_LEGAL (aquí y en la app) y todos
// vuelven a aceptar al entrar (Ley 1581: prueba de la autorización).

export const VERSION_LEGAL = '2026-10-24';
export const VIGENTE_DESDE = '24 de octubre de 2026';

export const RESPONSABLE = {
  nombre: 'Gustavo Andrés Cerón Galeano',
  ciudad: 'Cali, Valle del Cauca, Colombia',
  correo: 'cerongag12@gmail.com',
  telefono: '316 352 0199',
} as const;

export const ERROR_SIN_ACEPTAR = 'Para usar USCupo necesitas aceptar los términos y la política de privacidad.';

export const AVISO_NO_OFICIAL =
  'USCupo es un proyecto independiente de estudiantes y no es una app oficial de la Universidad Santiago de Cali.';

export type Bloque = string | { lista: string[] };
export type Seccion = { titulo: string; bloques: Bloque[] };
export type Documento = { titulo: string; resumen: string; secciones: Seccion[] };

export const PRIVACIDAD: Documento = {
  titulo: 'Política de privacidad y tratamiento de datos',
  resumen:
    'Cómo USCupo recoge, usa y protege tus datos personales, conforme a la Ley 1581 de 2012, el Decreto 1074 de 2015 y las políticas de Google Play.',
  secciones: [
    {
      titulo: '1. Responsable del tratamiento',
      bloques: [
        `${RESPONSABLE.nombre}, persona natural, domiciliado en ${RESPONSABLE.ciudad}. Correo para peticiones, consultas y reclamos: ${RESPONSABLE.correo}. Teléfono: ${RESPONSABLE.telefono}.`,
        AVISO_NO_OFICIAL +
          ' La Universidad no es responsable ni encargada del tratamiento de los datos que se recogen en USCupo.',
      ],
    },
    {
      titulo: '2. Datos que tratamos',
      bloques: [
        'Datos que tú nos das:',
        {
          lista: [
            'Nombre completo y correo institucional (@usc.edu.co).',
            'Carrera.',
            'Número de WhatsApp, solo si decides agregarlo.',
            'Tus ofertas de cambio: materia, grupo, horario que tienes, horarios que buscas y el comentario opcional.',
            'Tu actividad en el servicio: interés en ofertas, cambios confirmados y avisos.',
          ],
        },
        'Datos que se generan al usar el servicio:',
        {
          lista: [
            'Datos de sesión (tokens de acceso) y preferencias guardadas en tu equipo, como el tema claro u oscuro.',
            'En la app: identificador de publicidad, dirección IP y datos del dispositivo que recoge Google AdMob para mostrar anuncios y medirlos.',
            'En la web: cookies de Google AdSense para el mismo fin.',
          ],
        },
        'No pedimos datos sensibles (salud, origen étnico, orientación, datos biométricos ni similares) ni datos financieros. No pidas ni compartas datos sensibles en los comentarios de las ofertas.',
      ],
    },
    {
      titulo: '3. Para qué los usamos',
      bloques: [
        {
          lista: [
            'Crear y mantener tu cuenta, y comprobar que eres estudiante con tu correo institucional.',
            'Publicar tus ofertas y mostrarte las de otros estudiantes de tu carrera.',
            'Cuando alguien marca interés en tu oferta (o tú en la de otro), mostrar a ambos los datos de contacto que cada uno decidió dejar visibles, durante 7 días, para que coordinen el cambio.',
            'Enviarte avisos dentro del servicio sobre tus ofertas.',
            'Mostrar anuncios que financian el servicio.',
            'Mantener la seguridad, prevenir abusos y atender tus solicitudes.',
          ],
        },
        'USCupo no gestiona ni garantiza el cambio de horario: ese trámite se hace en los canales oficiales de la Universidad.',
      ],
    },
    {
      titulo: '4. Quién ve tus datos',
      bloques: [
        {
          lista: [
            'Otros estudiantes: tu nombre, tu carrera y tus ofertas. Tu correo y tu WhatsApp solo los ve la persona con la que estás en conversación por una oferta, y solo los que tengas visibles en tu perfil.',
            'Proveedores que nos prestan servicios y actúan como encargados: Supabase (base de datos y cuentas), Vercel (alojamiento de la web), Google (AdMob y AdSense) y Microsoft (solo si eliges entrar con tu cuenta de Microsoft).',
            'Autoridades, cuando una ley o una orden judicial lo exija.',
          ],
        },
        'No vendemos ni alquilamos tus datos.',
      ],
    },
    {
      titulo: '5. Transferencia internacional',
      bloques: [
        'Los proveedores anteriores guardan los datos en servidores fuera de Colombia (por ejemplo, en Estados Unidos). Al aceptar esta política autorizas esa transferencia, que se hace con proveedores que ofrecen niveles adecuados de protección.',
      ],
    },
    {
      titulo: '6. Cuánto tiempo los guardamos',
      bloques: [
        'Mientras tengas tu cuenta. Tus ofertas resueltas o vencidas quedan en tu historial. Si eliminas tu cuenta, borramos de inmediato tu perfil, tus ofertas, tus avisos y tu historial; las copias de seguridad del proveedor pueden conservarlos hasta 30 días antes de borrarse.',
      ],
    },
    {
      titulo: '7. Tus derechos',
      bloques: [
        'Como titular de los datos tienes derecho a:',
        {
          lista: [
            'Conocer, actualizar y rectificar tus datos. Puedes editar tu nombre y tu contacto en Perfil.',
            'Pedir prueba de la autorización que nos diste.',
            'Saber qué uso le damos a tus datos.',
            'Revocar la autorización y pedir que borremos tus datos. Puedes hacerlo tú mismo con "Eliminar cuenta" en Perfil.',
            'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) después de haber hecho tu solicitud ante nosotros.',
            'Acceder gratis a tus datos.',
          ],
        },
      ],
    },
    {
      titulo: '8. Cómo ejercerlos',
      bloques: [
        `Escribe a ${RESPONSABLE.correo} desde tu correo institucional, con tu nombre y lo que pides. Respondemos las consultas en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles. Si necesitamos más tiempo, te avisaremos el motivo antes de que venza el plazo.`,
      ],
    },
    {
      titulo: '9. Menores de edad',
      bloques: [
        'USCupo está dirigido a estudiantes mayores de 18 años. Si eres menor de edad, no uses el servicio.',
      ],
    },
    {
      titulo: '10. Seguridad',
      bloques: [
        'Usamos conexiones cifradas, reglas de acceso en la base de datos para que cada quien solo pueda ver y cambiar lo suyo, y no guardamos contraseñas en texto plano. Ningún sistema es infalible: si notas algo raro, escríbenos.',
      ],
    },
    {
      titulo: '11. Anuncios',
      bloques: [
        'La app usa Google AdMob y la web Google AdSense. Google puede usar identificadores de publicidad o cookies para mostrar anuncios y medirlos. Cuando la ley de tu país lo exige, la app te pide tu consentimiento y te deja cambiarlo en Perfil. Más información: policies.google.com/technologies/partner-sites.',
      ],
    },
    {
      titulo: '12. Cambios y vigencia',
      bloques: [
        `Esta política rige desde el ${VIGENTE_DESDE} y mientras USCupo esté en funcionamiento. Si la cambiamos, te pediremos aceptarla de nuevo al entrar.`,
      ],
    },
  ],
};

export const TERMINOS: Documento = {
  titulo: 'Términos de uso',
  resumen: 'Las reglas para usar USCupo. Al crear tu cuenta aceptas estos términos.',
  secciones: [
    {
      titulo: '1. Qué es USCupo',
      bloques: [
        'USCupo es un servicio gratuito que conecta a estudiantes que quieren cambiar de grupo u horario en una materia, para que se encuentren y coordinen el cambio.',
        AVISO_NO_OFICIAL +
          ' No tiene relación con la Universidad, no actúa en su nombre y no usa sus sistemas académicos.',
      ],
    },
    {
      titulo: '2. Lo que USCupo no hace',
      bloques: [
        {
          lista: [
            'No hace, aprueba ni garantiza cambios de horario. El cambio se tramita en los canales oficiales de la Universidad y depende de sus reglas y fechas.',
            'No verifica que lo publicado sea cierto ni que la otra persona cumpla lo acordado.',
            'No cobra ni intermedia pagos.',
          ],
        },
      ],
    },
    {
      titulo: '3. Quién puede usarlo',
      bloques: [
        'Estudiantes de la Universidad Santiago de Cali mayores de 18 años, con un correo institucional @usc.edu.co propio. La cuenta es personal: no la compartas.',
      ],
    },
    {
      titulo: '4. Reglas de uso',
      bloques: [
        'Al usar USCupo te comprometes a:',
        {
          lista: [
            'Publicar solo ofertas reales de grupos que tienes.',
            'Usar los datos de contacto de otros solo para coordinar el cambio.',
            'No cobrar, vender ni pedir dinero por un cupo o un cambio.',
            'No publicar contenido ofensivo, discriminatorio, engañoso, publicidad ni datos personales de terceros.',
            'No intentar acceder a cuentas o datos ajenos ni afectar el funcionamiento del servicio.',
          ],
        },
        'Podemos retirar contenido o suspender cuentas que incumplan estas reglas.',
      ],
    },
    {
      titulo: '5. Tu contenido',
      bloques: [
        'Lo que publicas es tuyo y eres responsable de ello. Nos das permiso para mostrarlo a otros estudiantes dentro del servicio mientras esté publicado.',
      ],
    },
    {
      titulo: '6. Anuncios',
      bloques: ['USCupo es gratuito y se financia con anuncios de Google, marcados como "Publicidad".'],
    },
    {
      titulo: '7. Disponibilidad y responsabilidad',
      bloques: [
        'El servicio se ofrece "tal como está". Hacemos lo posible por mantenerlo disponible, pero puede tener fallas o interrupciones. En la medida en que la ley lo permite, no respondemos por cambios de horario que no se concreten, por acuerdos entre estudiantes ni por daños derivados del uso del servicio. Nada de esto limita los derechos que te da la Ley 1480 de 2011 (Estatuto del Consumidor).',
      ],
    },
    {
      titulo: '8. Cancelar tu cuenta',
      bloques: [
        'Puedes eliminar tu cuenta cuando quieras desde Perfil → Eliminar cuenta, en la app o en la web, o siguiendo los pasos en uscupo.vercel.app/eliminar-cuenta.',
      ],
    },
    {
      titulo: '9. Marcas',
      bloques: [
        'El nombre y los símbolos de la Universidad Santiago de Cali pertenecen a ella. USCupo los menciona solo para indicar a qué estudiantes está dirigido.',
      ],
    },
    {
      titulo: '10. Cambios, ley aplicable y contacto',
      bloques: [
        `Si cambiamos estos términos te pediremos aceptarlos de nuevo al entrar. Se rigen por las leyes de Colombia. Contacto: ${RESPONSABLE.correo}. Vigentes desde el ${VIGENTE_DESDE}.`,
      ],
    },
  ],
};

export const ELIMINAR_CUENTA: Documento = {
  titulo: 'Eliminar tu cuenta de USCupo',
  resumen: 'Puedes borrar tu cuenta y tus datos cuando quieras. No se puede deshacer.',
  secciones: [
    {
      titulo: 'Desde la app o la web',
      bloques: [
        {
          lista: [
            'Inicia sesión en la app o en uscupo.vercel.app.',
            'Ve a Perfil.',
            'Toca "Eliminar cuenta", escribe ELIMINAR y confirma.',
          ],
        },
      ],
    },
    {
      titulo: 'Si ya no tienes la app',
      bloques: [
        `Escribe a ${RESPONSABLE.correo} desde tu correo institucional con el asunto "Eliminar mi cuenta". La borramos en máximo 15 días hábiles y te confirmamos por correo.`,
      ],
    },
    {
      titulo: 'Qué se borra',
      bloques: [
        {
          lista: [
            'Tu cuenta, tu perfil (nombre, correo, carrera y WhatsApp) y tus preferencias.',
            'Todas tus ofertas (también las que estaban en conversación con alguien), tus avisos y tu historial de cambios.',
            'Si habías marcado interés en la oferta de otra persona, esa oferta vuelve a quedar disponible.',
          ],
        },
        'Las copias de seguridad del proveedor pueden conservar los datos hasta 30 días antes de borrarse. Los datos de anuncios los gestiona Google según su política.',
      ],
    },
  ],
};
