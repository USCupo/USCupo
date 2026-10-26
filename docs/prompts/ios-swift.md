# Prompt: app iOS de USCupo (Swift / Xcode)

Copia todo lo que está debajo de la línea y pégalo como primer mensaje en Claude con un
proyecto de Xcode vacío abierto (App, SwiftUI, Swift). Referencias vivas: la web
(`USCupo/`, Expo) y la app Android (`USCupoAndroid/`, Kotlin + Compose), que ya es un port
nativo completo y es la referencia más cercana para iOS.

---

Vas a construir la app iOS nativa de **USCupo**. La web y la app Android ya existen y
funcionan; la app iOS es su versión nativa, con el mismo backend, las mismas reglas, los mismos
textos y la misma identidad visual. No inventes colores, tipografías, textos ni flujos nuevos:
todo lo que necesitas está aquí. Si algo no está definido, pregúntame antes de decidir. Si tienes
acceso a los repositorios, la app Android (`USCupoAndroid/app/src/main/java/co/edu/usc/uscupo/`)
es la fuente para resolver dudas de comportamiento: `controller/` tiene la lógica de cada
pantalla y `model/` los repositorios y reglas.

## Qué es USCupo

Bolsa de intercambio de cupos/horarios entre estudiantes de la Universidad Santiago de Cali
(USC). Un estudiante publica "tengo el grupo X de la materia M en este horario, busco estos
otros horarios". Si otro estudiante tiene lo que él busca y busca lo que él tiene, hay
**coincidencia**. Al marcar interés, los dos ven el contacto del otro durante 7 días; hacen el
cambio en los canales oficiales de la USC y lo confirman en la app.

**USCupo es un proyecto independiente de estudiantes y no es una app oficial de la
universidad.** Nunca uses el escudo, el nombre de la USC como marca ni frases que sugieran
afiliación. Responsable: persona natural, Gustavo Andrés Cerón Galeano
(uscupo.app@outlook.com).

Solo pueden entrar cuentas institucionales `@usc.edu.co`. Cada estudiante ve **solo** ofertas
de las materias de **su** carrera: alguien de Ingeniería de Sistemas nunca ve ofertas de
Medicina Veterinaria.

## Stack obligatorio

- Swift 6 con concurrencia estricta, SwiftUI, iOS 17 como mínimo. Bundle id `app.uscupo`.
- Arquitectura MVVM: `Data/` (cliente y repositorios Supabase, modelos `Codable`), `Domain/`
  (reglas puras: match recíproco, días restantes, formato de horas, con tests de Swift
  Testing), `Features/<Pantalla>/` (vista + modelo `@Observable @MainActor`). Los repositorios
  son protocolos para poder probar los modelos con dobles en memoria.
- Backend: **Supabase ya existente** con `supabase-swift` (Swift Package Manager). URL y anon
  key en un `.xcconfig` fuera de git y leídas desde `Info.plist`; nunca en el código. **No
  modifiques el esquema**: si hace falta un cambio, propónme la migración SQL y espera.
- Sesión en el Keychain (lo que trae supabase-swift por defecto); preferencia de tema en
  `@AppStorage`.
- Anuncios: Google Mobile Ads SDK (AdMob) + UMP + App Tracking Transparency. **Solo ids de
  prueba de Google** en Debug. Los ids reales de iOS van por configuración de Release (en el
  `.xcconfig`), igual que Android: yo creo la app iOS en AdMob y te los doy.

## Backend (Supabase): tablas, vistas y funciones

- `carreras(id, nombre, tipo pregrado|tecnico|posgrado, facultad, sede, activa)`: lectura pública.
- `materias(id, carrera_id, nombre, codigo, semestre)`: lectura pública.
- `bloques_horario(id, dias text[], hora_inicio time, hora_fin time, etiqueta)`: una franja
  única por (días, inicio, fin).
- `profiles(id, nombre_completo, correo, carrera_id, whatsapp, mostrar_correo, mostrar_whatsapp,
  legal_version, legal_aceptado_en, created_at)`: cada quien lee y edita solo el suyo, y solo
  las columnas de datos personales (`legal_*` solo cambia por RPC).
- vista `perfiles_publicos(id, nombre_completo, carrera_id)`: lo único visible de otros.
- `ofertas(id, user_id, materia_id, grupo, bloque_actual_id, comentario, estado disponible|en_proceso|resuelta|expirada, interesado_id, interesado_at, resuelta_at, created_at, expires_at)`.
- `ofertas_busco(oferta_id, bloque_id)`: los horarios que busca cada oferta.
- `notificaciones(id, user_id, tipo interes_recibido|cambio_confirmado|oferta_expirada, oferta_id, leida, created_at)`.
- RPC (todas `security definer`, sin acceso anónimo):
  - `expresar_interes(p_oferta_id)`: pasa la oferta a `en_proceso` y notifica al dueño.
  - `contacto_revelado(p_oferta_id)`: devuelve `perfil_id, nombre_completo, correo, whatsapp`
    del otro, respetando `mostrar_*`.
  - `confirmar_cambio(p_oferta_id)`: marca la oferta como `resuelta`.
  - `bloque_para_franja(p_dias text[], p_inicio time, p_fin time) → bigint`: devuelve el id de
    la franja y la crea si no existe. Úsala al publicar con hora libre: antes busca si la franja
    ya está en `bloques_horario` y solo llama la RPC si no está.
  - `aceptar_legal(p_version text) → profiles`: guarda la versión aceptada y la fecha (prueba de
    la autorización de la Ley 1581).
  - `eliminar_mi_cuenta()`: borra la cuenta y sus datos (también sus reportes y bloqueos). Las
    ofertas propias (incluidas las que estaban en proceso) se eliminan; las ofertas de otros en
    las que el usuario era el interesado vuelven a `disponible`.
  - `reportar_oferta(p_oferta_id, p_motivo, p_detalle)`: `p_motivo` ∈ `ofensivo`,
    `datos_personales`, `spam`, `falso`, `otro`; `p_detalle` opcional (máx. 500). Repetir el
    reporte no falla. No se puede reportar la oferta propia.
  - `bloquear_usuario(p_usuario_id uuid)` / `desbloquear_usuario(p_usuario_id uuid)`: el bloqueo
    es mutuo e invisible; al bloquear, un cambio en proceso entre los dos vuelve a `disponible`.
  - `mis_bloqueados() → (usuario_id, nombre_completo, bloqueado_en)`: para la lista de Perfil.
- **Liberar** (el dueño suelta una oferta en proceso): RPC `liberar_oferta(p_oferta_id)`. Si la
  oferta ya no estaba en proceso, muestra "Esta oferta ya no está en proceso. Actualizamos la
  lista." y recarga.
- **Protecciones del servidor** (triggers `proteger_oferta` y `proteger_correo`): el cliente no
  puede asignar `interesado_id` ni mover `estado` salvo `en_proceso → disponible` sin
  interesado, y no puede cambiar `profiles.correo`. Todo lo demás pasa por las RPC de arriba.
- Tablas `reportes` y `bloqueos`: **el cliente no las lee ni escribe**; todo pasa por las RPC. La
  RLS de `ofertas` ya oculta una oferta a quien la reportó, a todos cuando suma 3 reportes
  pendientes, y en ambos sentidos entre usuarios bloqueados (también en `buscar_matches` y
  `expresar_interes`). Las ayudas de esa RLS viven en el esquema `privado`, que la API no
  publica: no intentes llamarlas. Después de reportar o bloquear, basta con recargar la lista.
- El trigger `handle_new_user` crea el perfil, rechaza correos fuera de `@usc.edu.co` y guarda
  `legal_version` si llega en los metadatos del registro.
- La expiración es una función SQL `expirar_ofertas()` que pg_cron corre **cada hora**: pasa a
  `expirada` las ofertas en proceso con `expires_at` vencido y avisa al dueño
  (`oferta_expirada`). La oferta no se borra: queda en el historial de Perfil. No prometas en los
  textos que vence "al minuto".

## Datos locales, caché y recargas

Supabase es la **única fuente de verdad**, la misma que usan la web y Android. No crees una
base de datos propia que la reemplace ni sincronización bidireccional.

- **Siempre en vivo desde Supabase:** `ofertas`, `ofertas_busco`, `notificaciones`, `profiles`
  y todas las RPC. Todas las escrituras van directo a Supabase.
- **Catálogo con caché en SwiftData:** `carreras`, `materias` y `bloques_horario`. Caché
  primero: devuelve lo de SwiftData al instante y **revalida con Supabase una sola vez por
  proceso y por clave** (`carreras`, `materias-{carreraId}`, `bloques`); las lecturas siguientes
  salen solo de SwiftData. Si la revalidación falla, se reintenta en la siguiente lectura. Sin
  caché ni red, `carreras` cae a un respaldo empaquetado en el bundle (JSON) para que el selector
  nunca quede vacío.
- **Carga al ganar foco** (como `CargaEnFoco` en Android): cada pestaña carga al aparecer y al
  volver de segundo plano, con estas reglas medidas en Android:
  - Primera carga: skeleton (ver abajo). Las siguientes son **silenciosas**: no muestran
    indicador ni vacían la pantalla.
  - Si la última carga buena tiene **menos de 15 s**, no se vuelve a pedir (ir y volver entre
    pestañas no repite 5–7 consultas). Si hay una carga en curso, no se reinicia.
  - `.refreshable` (tirar para recargar) y las acciones (publicar, marcar interés, confirmar,
    liberar, retirar) **siempre** recargan; solo `.refreshable` muestra el indicador.
  - Si dos cargas se cruzan, gana la más reciente. Un error conserva los datos previos y
    muestra el aviso.
  - Mis cambios recarga aunque los datos sean recientes si hay avisos sin ver, y al abrirse los
    marca como leídos.
- **`@AppStorage`:** tema y preferencias de UI (último filtro, borradores de formulario).
- **Sesión:** la gestiona `supabase-swift` en el Keychain; no la copies a SwiftData ni a
  `UserDefaults`.
- **Sin conexión:** muestra el catálogo en caché y un aviso "Sin conexión". Bloquea las acciones
  que escriben con un mensaje claro; **no las encoles** para enviarlas después.
- Al cerrar sesión (si el servidor falla, cierra igual la sesión local) o eliminar la cuenta,
  borra la caché de SwiftData y las preferencias ligadas al usuario.

## Reglas de dominio

- Match recíproco: misma materia, distinto dueño, la otra ofrece un bloque que yo busco **y**
  busca el bloque que yo tengo. "Me sirve": ofrece algo que busco aunque no busque lo mío.
- Una sola oferta activa (`disponible` o `en_proceso`) por materia y usuario.
- No se puede buscar el mismo horario que se tiene. La hora final debe ser posterior a la inicial.
- Formato de horas en español de Colombia: `7:30 a.m.`, `2:00 p.m.`, mediodía `12:00 m.`.
  Días: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, y los pares "Lunes y Miércoles" y
  "Martes y Jueves". Abreviados: Lun, Mar, Mié, Jue, Vie, Sáb.

## Autenticación y flujo de entrada

- Correo institucional + contraseña (mínimo 8 caracteres), con validación de dominio en el
  cliente y en el servidor.
- Microsoft 365 (proveedor `azure` de Supabase) con `domain_hint=usc.edu.co` y `login_hint`
  si ya escribieron el correo; PKCE con `ASWebAuthenticationSession`; esquema de URL
  `uscupo://auth/callback`. Avísame qué URL de retorno debo añadir en Supabase →
  Authentication → URL Configuration.
- Sign in with Apple **no** se añade: la guía 4.8 de Apple exime a las apps que solo aceptan
  cuentas educativas existentes. Explícalo así en las notas de revisión.
- **Confirmación de correo activa** en Supabase: `signUp` no devuelve sesión. Tras crear la
  cuenta muestra "Cuenta creada. Abre el enlace que enviamos a {correo} para confirmarla y luego
  inicia sesión." Si al entrar Supabase responde "Email not confirmed", muestra "Confirma tu
  cuenta desde el enlace que enviamos a tu correo institucional." En los dos casos aparece un
  botón secundario **"Reenviar correo de confirmación"** (`auth.resend(email:type: .signup)`) con
  60 s de espera entre envíos ("Reenviar confirmación en N s") y, al enviar, "Enviamos otro
  enlace a {correo}. Revisa también el correo no deseado."
- **Mantener sesión iniciada** (casilla en el modo "Iniciar sesión", debajo de la contraseña,
  desmarcada por defecto). Título "Mantener sesión iniciada" y debajo, en secundario, "30 días en
  este equipo. Si no la marcas, la sesión se cierra al cerrar la app." Aplica también a
  Microsoft. Implementación: un `AuthLocalStorage` propio para `supabase-swift`:
  - marcada → Keychain, más una fecha `recordarHasta = ahora + 30 días` en `UserDefaults`;
  - desmarcada → solo en memoria (al matar la app se pierde la sesión);
  - al abrir la app y al volver a primer plano, si `recordarHasta` ya pasó, borra la sesión del
    Keychain y la fecha, y cierra sesión local;
  - el verificador PKCE va siempre al Keychain (el canje no debe perderse si el sistema mata la
    app mientras el usuario está en Microsoft);
  - las sesiones abiertas antes de esta casilla se respetan 30 días más desde la primera
    apertura con esta versión.
- **¿Olvidaste tu contraseña?** (enlace a la derecha, bajo el campo de contraseña, solo en
  "Iniciar sesión"). Abre **Recuperar contraseña** dentro de la app, con el mismo marco de
  cristal del login e insignia redonda (`envelope` sobre `accentTint`):
  - "Recupera tu contraseña" / "Escribe tu correo institucional y te enviamos un enlace para
    crear una nueva." / campo de correo (prellenado con lo que había en el login) / "Enviar
    enlace" / aviso: "Si entras con tu cuenta de Microsoft, tu contraseña es la de la USC y se
    cambia en Microsoft 365." / "¿La recordaste? **Inicia sesión**".
  - Llama `auth.resetPasswordForEmail(correo, redirectTo: Legal.urlRestablecer)`. La respuesta
    es la misma exista o no la cuenta.
  - Enviado: "Revisa tu correo" / "Si hay una cuenta de USCupo con **{correo}**, te llegará un
    enlace para crear una contraseña nueva. El enlace vence en una hora." / "¿No llega? Revisa
    la carpeta de correo no deseado." / "Reenviar en N s" (60 s) / "Usar otro correo".
  - Errores: "Ya enviamos varios correos en la última hora. Espera un rato antes de pedir otro
    enlace." (email rate limit) y "Espera un minuto antes de pedir otro enlace." (for security
    purposes).
  - **El enlace del correo abre la web** (`https://www.uscupo.com/restablecer?token_hash=…`),
    que ya cambia la contraseña y funciona en cualquier dispositivo. Primera versión: no
    intercepta el enlace. Si después quieres abrirlo dentro de la app (Universal Links), la web
    debe publicar `/.well-known/apple-app-site-association`: avísame y lo agrego en la web.
- Tras entrar, la raíz decide el destino **en este orden**:
  1. `legal_version` del perfil distinta de `VERSION_LEGAL` → **Aceptar legal**.
  2. Perfil sin carrera → **Completar perfil**.
  3. Si no → pestañas.
  La raíz cambia de destino con un fundido, sin animación de navegación.

## Legal y cumplimiento (Ley 1581 de 2012, App Store)

Constantes (mismos valores que Android `model/legal/Legal.kt` y la web `src/models/legal.ts`):

```swift
enum Legal {
    static let avisoNoOficial = "USCupo es un proyecto independiente de estudiantes y no es una app oficial de la Universidad Santiago de Cali."
    static let urlWeb = URL(string: "https://www.uscupo.com")!
    static let urlPreguntas = urlWeb.appending(path: "preguntas")
    static let urlRecuperar = urlWeb.appending(path: "recuperar")
    static let urlRestablecer = urlWeb.appending(path: "restablecer")
    static let urlPrivacidad = urlWeb.appending(path: "privacidad")
    static let urlTerminos = urlWeb.appending(path: "terminos")
    static let urlEliminarCuenta = urlWeb.appending(path: "eliminar-cuenta")
    static let correoContacto = "uscupo.app@outlook.com"
    /// Se sube cuando cambia el texto de términos o política: todos vuelven a aceptar al entrar.
    static let version = "2026-10-24.4"
}
```

- **Casilla de autorización** (componente `CasillaLegal`): previa, expresa e informada. Nunca
  viene marcada. Texto: "Acepto los **Términos de uso** y autorizo el tratamiento de mis datos
  personales según la **Política de privacidad**." Los dos enlaces abren las páginas web
  (`SFSafariViewController` o `openURL`) sin perder el formulario; solo la casilla alterna, no el
  texto. Error: "Para usar USCupo necesitas aceptar los términos y la política de privacidad."
- **Crear cuenta**: la casilla es obligatoria y `legal_version` viaja en los metadatos del
  registro.
- **Aceptar legal** (cuentas de Microsoft, anteriores a la casilla o con versión vieja): logo y
  wordmark, tarjeta "Antes de continuar" con el texto "Para mostrar tus ofertas y compartir tu
  contacto cuando haya un cambio, USCupo trata tu nombre, correo institucional, carrera y, si lo
  agregas, tu WhatsApp. Léelos y acéptalos para seguir.", la casilla, "Aceptar y continuar"
  (llama `aceptar_legal`), "No acepto, cerrar sesión" y la nota con el aviso no oficial.
- **Login**: el pie lleva el aviso no oficial.
- **Perfil → "Acerca de USCupo"**: aviso no oficial, Preguntas frecuentes (`urlPreguntas`), Términos de uso, Política de privacidad,
  "Opciones de privacidad de anuncios" (solo si UMP dice que se requieren; abre el formulario de
  UMP), "Escríbenos" (`mailto:`) y la versión de la app.
- **Eliminar cuenta** (obligatorio en App Store, guía 5.1.1(v)): botón de texto en Perfil →
  diálogo que explica qué se borra (lo mismo que hace `eliminar_mi_cuenta`) y exige escribir
  `ELIMINAR` para habilitar el botón destructivo. Al terminar, cierra sesión y limpia la caché.
- **Para la revisión de Apple**, prepara y explícame: `PrivacyInfo.xcprivacy` (el SDK de AdMob
  trae el suyo; declara el de la app), `NSUserTrackingUsageDescription` en español, la lista de
  `SKAdNetworkItems` de Google, las respuestas de App Privacy (correo, nombre, teléfono opcional,
  identificador de dispositivo para anuncios) y la clasificación por edad (17+ no hace falta;
  marca "contenido generado por usuarios" con moderación).
- **Contenido generado por usuarios (guía 1.2)**: ya está resuelto en el backend y en Android;
  replícalo igual (ver "Reportar y bloquear" en Pantallas). Los términos ya declaran tolerancia
  cero con contenido objetable y explican el reporte y el bloqueo.
- **Cuenta para la revisión de Apple**: correo y contraseña de la cuenta de revisión (te los doy
  aparte; nunca los escribas en el código ni en el repo). En las notas: "Toca 'Iniciar sesión',
  entra con el correo y la contraseña, y acepta los términos." 

## Pantallas (mismo contenido y textos que la web y Android)

1. **Login / Crear cuenta**: segmentado entre los dos modos; nombre, correo, carrera (lista
   agrupada por facultad, con `searchable`), contraseña, casilla legal (solo al crear); botón
   "Continuar con Microsoft".
2. **Aceptar legal**: ver arriba.
3. **Completar perfil**: carrera y WhatsApp opcional.
4. **Inicio**: "Hola, " en `onBackground` seguido del primer nombre en `accent` (un solo `Text`
   con dos estilos, un solo encabezado para VoiceOver) + carrera y sede. Secciones: "Te están esperando" (mis ofertas
   en proceso), "Coincidencias para ti" (hasta 4), "Ofertas en tu carrera (N)" con todas las
   ofertas disponibles de mi carrera, filtro por materia en chips con su cantidad y "Mostrar N
   más" de a 8, Avisos, "Cómo funciona" (3 pasos) y un espacio de anuncio. En iPad, dos
   columnas (principal 2/3, lateral 1/3).
5. **Buscar**: filtros por materia, día y "solo coincidencias"; tarjetas de oferta ordenadas
   por disponibles, match, me sirve; confirmación antes de marcar interés.
6. **Publicar**: materia, grupo, "Lo que tienes" (una franja), "Lo que buscas" (varias) y un
   comentario opcional. Cada franja: chips de días y un **selector de rango de hora**: dos
   píldoras "Desde" / "Hasta" que muestran la hora (`7:00 a.m.`); al tocar una se despliega con
   resorte un panel con tres ruedas (hora 1-12, minutos de 5 en 5, a.m./p.m.) y el botón
   "Listo". Usa `Picker` con `.pickerStyle(.wheel)` (tres columnas) o una rueda propia con
   `ScrollView` + `.scrollTargetBehavior(.viewAligned)`, la que se vea más fiel: ítem central
   al 100 %, los demás al 25 % de opacidad y 82 % de escala, banda central en píldora y
   `.sensoryFeedback(.selection)` al pasar cada ítem. Debajo, la duración ("1 h 30 min de clase").
   Sin anuncios en esta pantalla.
7. **Mis cambios**: mis ofertas y aquellas donde marqué interés; ver contacto, confirmar,
   liberar, retirar.
8. **Perfil**: datos, contacto visible (toggles), historial, interruptor de tema, "Usuarios
   bloqueados" (solo si hay), "Acerca de USCupo", cerrar sesión y eliminar cuenta.

**Títulos de pantalla**: el título grande de cada pestaña (Buscar, Publicar un cupo, Mis
cambios, Perfil) va en `accent` (`#D4AF37`); el subtítulo sigue en `onBackgroundMuted`.

**Tarjeta de oferta**: materia, grupo · semestre, insignias (Match, En proceso, Resuelta,
Expirada), fila "Tiene ⇄ Busca" en dos columnas iguales **con la etiqueta y el contenido de cada
franja centrados** (días en negrita, rango de horas debajo, sin partir "a.m." de la hora),
comentario en cursiva entre comillas, separador y la fila del autor ("Nombre · hace 3 h").

**Reportar y bloquear** (igual que Android, `view/componentes/Moderacion.kt` y
`controller/ModeracionController.kt`):
- En toda tarjeta **ajena** (Buscar, Inicio, "Te interesaron" en Mis cambios) la fila del autor
  termina en un botón `ellipsis` (vertical) de 44 pt, VoiceOver "Más opciones". Abre un menú
  flotante con el estilo de cristal de la app (no el `Menu` gris del sistema si no se puede
  estilizar: usa un `popover` con `.presentationCompactAdaptation(.popover)` o un panel propio):
  tarjeta de radio 32, `surface`, borde `border` al 90 %, sombra; cada opción es una fila con
  el ícono dentro de un círculo de 36 pt (`flag` en `link` sobre `primaryTint`; `nosign` en
  `danger` sobre `danger` al 14 %) y el texto en semibold del mismo color: "Reportar oferta" y
  "Bloquear a {nombre}".
- En mis ofertas **en proceso** ("Quieren tu cupo") el menú solo ofrece "Bloquear a
  {interesado}".
- **Diálogo de reporte** (mismo diálogo de confirmación de la app): título "Reportar oferta",
  texto "Cuéntanos qué pasa con esta oferta de {materia}. Quien la publicó no sabrá que la
  reportaste.", cinco opciones con el estilo de fila seleccionable de los selectores (radio 20,
  `primaryTint` y borde `link` al elegir, ✓ relleno a la derecha): "Contenido ofensivo o acoso",
  "Comparte datos personales", "Spam o publicidad", "Oferta falsa o engañosa", "Otro motivo";
  campo multilínea "Detalle (opcional)" con placeholder "Qué viste" (máx. 500). "Enviar reporte"
  deshabilitado hasta elegir motivo. Al terminar, aviso "Gracias por avisar. Revisaremos la
  oferta y ya no la verás." y recarga de la lista. Si la oferta reportada era una en la que
  **yo** marqué interés (`en_proceso`), sigue visible para mí, así que el aviso es solo
  "Gracias por avisar. Revisaremos la oferta.".
- **Diálogo de bloqueo** (destructivo): "¿Bloquear a {nombre}?" / "No verán las ofertas del otro
  ni podrán marcar interés entre ustedes. Si tenían un cambio en curso, se cancela. No le
  avisaremos. Puedes desbloquear desde Perfil." / "Bloquear". Aviso: "Bloqueaste a {nombre}. Ya
  no verán sus ofertas entre ustedes."
- Mientras la acción corre, el diálogo no se cierra ni se repite; sin red: "Sin conexión. …"
  (mismo texto que las demás acciones) y no llama.
- **Perfil → "Usuarios bloqueados"**: tarjeta con "No ven tus ofertas ni tú las suyas. No saben
  que los bloqueaste." y una fila por persona con su nombre y un botón de texto "Desbloquear"
  (con estado de carga). Aviso: "Desbloqueaste a {nombre}".

**Skeleton loader** en la primera carga de Inicio, Buscar, Mis cambios y Publicar (no un
spinner): bloques con la silueta de lo que viene (tarjeta de oferta: título 60 % + subtítulo
35 % + insignia en píldora; dos columnas de franja; fila de contacto; botón en píldora) en
`primaryTint` dentro de tarjetas y `onBackgroundBorder` sobre el degradado. Todos los huesos de
una pantalla laten juntos con un solo valor (opacidad 0.55 → 1.0, 0.75 s, ida y vuelta,
ease-in-out); estático con Reduce Motion. Para VoiceOver es **un solo elemento** "Cargando tu
resumen…" / "Buscando ofertas…" / "Cargando tus cambios…" / "Cargando…" con rasgo de progreso.

## Identidad visual (respétala exactamente)

Defínela en un Asset Catalog con variantes Any/Dark y en un `enum Tema` con los mismos nombres.

| Token | Claro | Oscuro |
| --- | --- | --- |
| background (inicio del degradado) | `#0A2959` | `#061733` |
| backgroundEnd (fin del degradado) | `#08234B` | `#030C1E` |
| onBackground | `#FFFFFF` | `#F2F5FA` |
| onBackgroundMuted | blanco 76 % | `#F2F5FA` 72 % |
| onBackgroundBorder | blanco 18 % | `#F2F5FA` 14 % |
| surface (tarjetas, formularios) | `#FFFFFF` | `#0D2142` |
| text | `#0A2959` | `#EAF0F8` |
| textMuted | `#4F6080` | `#A3B3CC` |
| border | `#D5DEEA` | `#22385E` |
| primary (botones) | `#165487` | `#1E62A0` |
| onPrimary | `#FFFFFF` | `#FFFFFF` |
| link | `#165487` | `#8DBBEA` |
| primaryTint | `#E8EFF7` | `#15305A` |
| accent (amarillo USC) | `#D4AF37` | `#D4AF37` |
| accentText | `#7A5A00` | `#E2C25E` |
| accentTint | `#FBF5E1` | `#2A2410` |
| danger | `#B3271E` | `#F2887E` |

- Fondo de toda pantalla: `LinearGradient` diagonal background → backgroundEnd (`.topLeading`
  → `.bottomTrailing`) que ignora las áreas seguras, con texto onBackground encima. Bajo la barra
  de estado, un velo del color `background` que se desvanece en 12 pt para que el contenido que
  sube no se mezcle con la hora.
- Tipografía: **Poppins SemiBold** para títulos, **Inter** Regular/Bold para el texto (inclúyelas
  en el bundle y regístralas en `Info.plist`), escaladas con `relativeTo:` para Dynamic Type.
  Escala: título de pantalla 28/34 (32/38 en iPad), sección 20/26, tarjeta 16/22, cuerpo 16/22,
  secundario 13.5/18, insignia Inter Bold 11 con tracking 0.6. Nada de mayúsculas sostenidas.
- Espaciado en base 8: 4, 8, 16, 24, 32, 40. Táctil mínimo 44 pt.
- **Un solo lenguaje de formas, el del dock** (siempre `.continuous`):
  - Controles de una línea (botones, campos, chips, selectores, píldoras de hora): `Capsule`.
  - Tarjetas, paneles y diálogos: radio 32 (la mitad del alto del dock).
  - Cajas internas de varias líneas y filas seleccionables (notas, franjas, opciones de una
    lista, comentario multilínea): radio 20.
- **Cristal** (regla de la marca): superficies flotantes, translúcidas y redondeadas que dejan ver
  el degradado, solo con los colores de arriba:
  - Tarjetas: `surface` al 90 %, borde de 1 pt `border` al 90 % y sombra suave hacia abajo. Sin
    desenfoque (se desplazan; el desenfoque se reserva a lo que flota fijo).
  - Barra de pestañas propia (oculta la `TabView` estándar o usa un `safeAreaInset(edge: .bottom)`):
    **dock flotante** en `Capsule`, a 12 pt de los bordes y sobre el home indicator, 64 pt de
    alto, con `.ultraThinMaterial` y encima `surface` al 80 %, borde de 1 pt `border` al 90 % y
    sombra (radio 20, y 18, negro al 35 %). El contenido se desplaza por debajo y reserva ese alto
    al final de cada lista.
  - Ítems: SF Symbols `house`, `magnifyingglass`, `plus.circle`, `arrow.left.arrow.right`,
    `person` (`.fill` para el activo); etiqueta de 11 pt en una sola línea que **se encoge** si no
    cabe (`.lineLimit(1).minimumScaleFactor(0.8)`; "Mis cambios" es la más larga). El activo
    lleva una cápsula `primaryTint` detrás del ícono y color `link`. "Publicar" es una cápsula
    `primary` con "+". "Mis cambios" muestra un contador amarillo (accent, texto `#0A2959`,
    "9+" desde 10) con los avisos sin leer, y VoiceOver dice "Mis cambios, N pendientes".
    Transición del indicador con `matchedGeometryEffect`.
  - En iPad en horizontal usa la píldora superior: material oscuro con `backgroundEnd` al 72 %,
    logo + "USC" en blanco + "upo" en amarillo, pestañas en cápsula (la activa con blanco al 12 %
    y su ícono en amarillo), interruptor de tema y un avatar amarillo con la inicial.
- **Movimiento** (los mismos resortes de la web, `src/theme/motion.ts`):
  `.spring(response: 0.39, dampingFraction: 0.81)` para la interfaz y
  `.spring(response: 0.33, dampingFraction: 0.53)` para el interruptor de tema. Todo se puede
  interrumpir. Respeta `accessibilityReduceMotion` (cambia a fundido o a estático).
- **Navegación**: entre pestañas no hay jerarquía: fundido cruzado, sin deslizar, y cada
  pestaña conserva su scroll y su estado. Cada pestaña recuerda su posición; Buscar abierto con
  una materia (desde Inicio) llega con ese filtro. En pantallas apiladas usa el gesto atrás
  nativo de `NavigationStack`; no añadas animaciones propias de "recoger" o encoger la vista al
  volver (en Android se quitaron a pedido del usuario: al volver, la vista anterior aparece con
  un deslizamiento simple).
- Anuncios: un banner adaptable de AdMob por pantalla como máximo, con la etiqueta
  "Publicidad" encima, **sin tarjeta ni fondo propio**, con 24 pt de aire arriba y abajo, nunca
  en Publicar ni pegado a un botón. Reserva el alto desde el inicio para que la lista no salte;
  pausa el banner en segundo plano. Solo se piden anuncios cuando UMP lo permite.
  **Política de Google (AdSense ya rechazó la web por esto):** nada de anuncios en pantallas
  sin contenido propio. El banner va solo en Inicio, Buscar y Mis cambios, y solo cuando la
  pantalla muestra ofertas (Inicio: coincidencias u ofertas de la carrera; Buscar: resultados;
  Mis cambios: alguna oferta). Nunca durante el skeleton, en un error, en un estado vacío, en
  Perfil, en Login, Recuperar contraseña, Aceptar legal ni Completar perfil.

## Calidad mínima

- VoiceOver con etiquetas en español, contraste AA y que Dynamic Type hasta XXL no rompa el diseño.
- Estados vacíos y de error en el tono de la web: dicen qué pasó y qué hacer, sin disculpas.
- Rendimiento: listas con `LazyVStack` e identificadores estables (id de la oferta), nada de
  trabajo pesado en `body`, y sin peticiones repetidas al cambiar de pestaña (regla de 15 s).
  Mide con Instruments (SwiftUI + Hitches) en un dispositivo real antes de dar una pantalla por
  terminada y dime los números.
- Sin claves ni contraseñas en el código. Credenciales de prueba solo en el `.xcconfig` local.

## Skills y plugins de Claude que debes usar

Si están instalados, cárgalos con la herramienta Skill en estos momentos (no los describas,
úsalos):

- `superpowers:brainstorming` antes de diseñar algo que no esté definido aquí, y
  `superpowers:writing-plans` para el plan del paso 1; `superpowers:executing-plans` o
  `superpowers:subagent-driven-development` para ejecutarlo.
- `superpowers:test-driven-development` para `Domain/` y los modelos de cada pantalla (Swift
  Testing), y `superpowers:systematic-debugging` ante cualquier fallo.
- `write-swift` siempre que escribas o revises Swift (Swift 6, concurrencia estricta, `@Observable`).
- `apple-design` para movimiento, gestos, materiales y tipografía al estilo iOS.
- `accessibility` al cerrar cada pantalla (VoiceOver, contraste, Dynamic Type).
- `security-audit` antes de la preparación para App Store (Keychain, `.xcconfig`, ATS, nada de
  secretos en el bundle).
- `superpowers:verification-before-completion` antes de decir que algo está hecho, y
  `superpowers:requesting-code-review` (o `/code-review`) al terminar cada bloque.
- `superpowers:finishing-a-development-branch` cuando yo autorice integrar.

## Cómo trabajamos

1. Primero propón el plan: estructura de carpetas, paquetes SPM con versiones y el orden de las
   pantallas. Espera mi visto bueno.
2. Construye por pantallas, en este orden: tema → auth + aceptar legal → Inicio → Publicar →
   Buscar → Mis cambios → reportar y bloquear → Perfil (con bloqueados, eliminar cuenta y acerca
   de) → anuncios + UMP/ATT → preparación para App Store (cuenta de Apple Developer de 99 USD al
   año: la abro yo al final).
3. Después de cada pantalla, compila, ejecútala en el simulador y dime qué probaste.
4. No hagas commit ni push hasta que yo lo diga.
