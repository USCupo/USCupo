# Anuncios de Google en USCupo

Registro de cómo están montados los anuncios y el paso a paso para activarlos.
Web usa **Google AdSense**. Las apps nativas (Android / iOS) usarán **Google AdMob**:
AdSense no funciona dentro de apps.

## Cómo funciona

1. Google subasta cada espacio publicitario cada vez que se muestra la página.
2. Paga por impresiones (CPM) y por clics (CPC). El pago llega mensual cuando el saldo supera
   el umbral (US$100) y la cuenta tiene datos fiscales y de pago verificados.
3. Nunca hagas clic en tus propios anuncios ni pidas clics: es causa de cierre de la cuenta.

## Lo que ya está en el código

- `src/components/EspacioAnuncio.tsx`: carga `adsbygoogle.js` una sola vez y pinta un
  `<ins class="adsbygoogle">` adaptable. Si faltan las variables de entorno, en desarrollo
  muestra un marco punteado "Espacio publicitario" y en producción no pinta nada.
- Ubicación actual: Inicio. En computador, columna lateral (bloque de 250 px de alto); en
  teléfono, al final de la columna principal.
- Variables (`.env` local y Vercel → Settings → Environment Variables):

  | Variable | Valor |
  | --- | --- |
  | `EXPO_PUBLIC_ADSENSE_CLIENT` | id de editor, `ca-pub-XXXXXXXXXXXXXXXX` |
  | `EXPO_PUBLIC_ADSENSE_SLOT_INICIO` | id del bloque de anuncio de Inicio (solo números) |

  Para un espacio nuevo: crea otro bloque en AdSense, añade `EXPO_PUBLIC_ADSENSE_SLOT_<PANTALLA>`
  y usa `<EspacioAnuncio slot={process.env.EXPO_PUBLIC_ADSENSE_SLOT_<PANTALLA>} />`.
- Aviso de cookies (`src/components/AvisoCookies.tsx`, modelo en
  `src/models/consentimientoAnuncios.ts`): panel de cristal que no bloquea el uso, con
  "No personalizados" / "Personalizados" y enlace a la política. Hasta que se elija,
  `EspacioAnuncio` pide anuncios no personalizados (`requestNonPersonalizedAds = 1`). La
  elección se guarda en el navegador (`uscupo.anuncios`) y se cambia en Perfil → "Opciones de
  privacidad de anuncios" (también en el pie legal del Login). Un cambio aplica a los anuncios
  que se pidan después de recargar.

## Paso a paso: activar AdSense en la web

1. **Requisitos previos.** Dominio propio (un `*.vercel.app` no se aprueba), sitio público
   con contenido real, página de política de privacidad y titular mayor de 18 años.
2. **Crear la cuenta.** Entra a https://adsense.google.com con la cuenta de Google que
   recibirá los pagos. Escribe la URL del sitio y el país (Colombia).
3. **Conectar el sitio.** AdSense te da el id `ca-pub-…`. Ponlo en
   `EXPO_PUBLIC_ADSENSE_CLIENT` en Vercel (Production y Preview) y vuelve a desplegar: el
   componente inserta el script que Google busca para verificar el sitio.
4. **ads.txt.** AdSense muestra una línea como
   `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`. Crea `public/ads.txt` con
   esa línea (Expo copia `public/` a la raíz del deploy) y comprueba que
   `https://<tu-dominio>/ads.txt` responde.
5. **Revisión.** Pide la revisión del sitio. Tarda de unos días a 2-4 semanas. Mientras
   tanto no cambies el dominio ni quites el script.
6. **Crear el bloque de anuncio.** Anuncios → Por bloque de anuncio → Display → formato
   adaptable. Copia el `data-ad-slot` en `EXPO_PUBLIC_ADSENSE_SLOT_INICIO` y redepliega.
7. **Consentimiento (CMP).** Privacidad y mensajes → activa el mensaje de consentimiento
   de Google para usuarios de la UE/EEE, Reino Unido y Suiza. Es obligatorio para servir
   anuncios personalizados allí. Elige un CMP certificado: el de Google (Privacidad y
   mensajes → Normativas europeas → Crear mensaje), con el sitio de USCupo, idioma español y
   el enlace a `https://<tu-dominio>/privacidad`. Para esos visitantes manda la elección del
   CMP de Google; nuestro aviso sigue valiendo para el resto (Colombia incluida).
8. **Pagos.** Configura datos fiscales, dirección (llega un PIN por correo postal) y forma
   de pago.
9. **Verificar.** Abre el sitio en una ventana privada sin bloqueador de anuncios. Los
   primeros anuncios pueden tardar unas horas en aparecer; mientras tanto el espacio queda vacío.

## Paso a paso: AdMob en las apps nativas (cuando existan)

1. https://admob.google.com → Agregar app → Android / iOS (después de publicada, o "no está
   en la tienda" para empezar).
2. Copia el **App ID** (`ca-app-pub-…~…`):
   - Android: `AndroidManifest.xml` → `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="…"/>`.
   - iOS: `Info.plist` → `GADApplicationIdentifier`, más `SKAdNetworkItems` y el texto de
     `NSUserTrackingUsageDescription` (App Tracking Transparency).
3. Crea bloques **Banner adaptable** con los mismos lugares que en la web (Inicio).
4. SDK: Android `com.google.android.gms:play-services-ads`; iOS `Google-Mobile-Ads-SDK`
   (Swift Package Manager). Inicializa el SDK al arrancar la app.
5. Durante el desarrollo usa **siempre los ids de prueba de Google**. Los ids reales solo
   en la versión de release.
6. Consentimiento: UMP SDK (User Messaging Platform) antes de pedir anuncios.
7. `app-ads.txt` en el dominio del sitio, el mismo que está declarado en la ficha de la tienda.

## Reglas de diseño para los espacios

- Máximo un anuncio por pantalla, nunca dentro del formulario de Publicar ni pegado a botones.
- Siempre con la etiqueta "Publicidad" encima y separado del contenido.
- El espacio usa el radio de las tarjetas (`radius.card + 8`) y no cambia los colores de la marca.
