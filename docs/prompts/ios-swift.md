# Prompt: app iOS de USCupo (Swift / Xcode)

Copia todo lo que está debajo de la línea y pégalo como primer mensaje en Claude con un
proyecto de Xcode vacío abierto (App, SwiftUI, Swift).

---

Vas a construir la app iOS nativa de **USCupo**. La web ya existe y funciona; la app es su
versión nativa, con el mismo backend, las mismas reglas y la misma identidad visual. No
inventes colores, tipografías ni flujos nuevos: todo lo que necesitas está aquí. Si algo no
está definido, pregúntame antes de decidir.

## Qué es USCupo

Bolsa de intercambio de cupos/horarios entre estudiantes de la Universidad Santiago de Cali
(USC). Un estudiante publica "tengo el grupo X de la materia M en este horario, busco estos
otros horarios". Si otro estudiante tiene lo que él busca y busca lo que él tiene, hay
**coincidencia**. Al marcar interés, los dos ven el contacto del otro durante 7 días; hacen el
cambio en los canales oficiales de la USC y lo confirman en la app.

Solo pueden entrar cuentas institucionales `@usc.edu.co`. Cada estudiante ve **solo** ofertas
de las materias de **su** carrera: alguien de Ingeniería de Sistemas nunca ve ofertas de
Medicina Veterinaria.

## Stack obligatorio

- Swift 6 con concurrencia estricta, SwiftUI, iOS 17 como mínimo.
- Arquitectura MVVM: `Data/` (cliente y repositorios Supabase, modelos `Codable`), `Domain/`
  (reglas puras: match recíproco, días restantes, formato de horas, con tests de Swift
  Testing), `Features/<Pantalla>/` (vista + modelo `@Observable @MainActor`).
- Backend: **Supabase ya existente** con `supabase-swift` (Swift Package Manager). URL y anon
  key en un `.xcconfig` fuera de git y leídas desde `Info.plist`; nunca en el código. **No
  modifiques el esquema**: si hace falta un cambio, propónme la migración SQL y espera.
- Sesión en el Keychain (lo que trae supabase-swift por defecto); preferencia de tema en
  `@AppStorage`.
- Anuncios: Google Mobile Ads SDK (AdMob) + UMP + App Tracking Transparency. **Solo ids de
  prueba de Google** hasta que yo te dé los reales.

## Backend (Supabase): tablas, vistas y funciones

- `carreras(id, nombre, tipo pregrado|tecnico|posgrado, facultad, sede, activa)`: lectura pública.
- `materias(id, carrera_id, nombre, codigo, semestre)`: lectura pública.
- `bloques_horario(id, dias text[], hora_inicio time, hora_fin time, etiqueta)`: una franja
  única por (días, inicio, fin).
- `profiles(id, nombre_completo, correo, carrera_id, whatsapp, mostrar_correo, mostrar_whatsapp, created_at)`:
  cada quien lee y edita solo el suyo.
- vista `perfiles_publicos(id, nombre_completo, carrera_id)`: lo único visible de otros.
- `ofertas(id, user_id, materia_id, grupo, bloque_actual_id, comentario, estado disponible|en_proceso|resuelta|expirada, interesado_id, interesado_at, resuelta_at, created_at, expires_at)`.
- `ofertas_busco(oferta_id, bloque_id)`: los horarios que busca cada oferta.
- `notificaciones(id, user_id, tipo interes_recibido|cambio_confirmado|oferta_expirada, oferta_id, leida, created_at)`.
- RPC:
  - `expresar_interes(p_oferta_id)`: pasa la oferta a `en_proceso` y notifica al dueño.
  - `contacto_revelado(p_oferta_id)`: devuelve `perfil_id, nombre_completo, correo, whatsapp`
    del otro, respetando `mostrar_*`.
  - `confirmar_cambio(p_oferta_id)`: marca la oferta como `resuelta`.
  - `bloque_para_franja(p_dias text[], p_inicio time, p_fin time) → bigint`: devuelve el id de
    la franja y la crea si no existe. Úsala al publicar con hora libre: antes busca si la franja
    ya está en `bloques_horario` y solo llama la RPC si no está.
- El trigger `handle_new_user` crea el perfil y rechaza correos fuera de `@usc.edu.co`.
- Hay una Edge Function `expirar-ofertas` (cron) que vence ofertas en proceso tras 7 días.

## Reglas de dominio

- Match recíproco: misma materia, distinto dueño, la otra ofrece un bloque que yo busco **y**
  busca el bloque que yo tengo. "Me sirve": ofrece algo que busco aunque no busque lo mío.
- Una sola oferta activa (`disponible` o `en_proceso`) por materia y usuario.
- No se puede buscar el mismo horario que se tiene. La hora final debe ser posterior a la inicial.
- Formato de horas en español de Colombia: `7:30 a.m.`, `2:00 p.m.`, mediodía `12:00 m.`.
  Días: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, y los pares "Lunes y Miércoles" y
  "Martes y Jueves". Abreviados: Lun, Mar, Mié, Jue, Vie, Sáb.

## Autenticación

- Correo institucional + contraseña (mínimo 8 caracteres), con validación de dominio en el
  cliente y en el servidor.
- Microsoft 365 (proveedor `azure` de Supabase) con `domain_hint=usc.edu.co` y `login_hint`
  si ya escribieron el correo; PKCE con `ASWebAuthenticationSession`; esquema de URL
  `uscupo://auth/callback`. Avísame qué URL de retorno debo añadir en Supabase →
  Authentication → URL Configuration.
- Tras entrar: si el perfil no tiene carrera, pantalla "Completar perfil"; si no, pestañas.

## Pantallas (mismo contenido y textos que la web)

1. **Login / Crear cuenta**: segmentado entre los dos modos; nombre, correo, carrera (lista
   agrupada por facultad, con `searchable`), contraseña; botón "Continuar con Microsoft".
2. **Completar perfil**: carrera y WhatsApp opcional.
3. **Inicio**: "Hola, {nombre}" + carrera y sede. Secciones: "Te están esperando" (mis ofertas
   en proceso), "Coincidencias para ti" (hasta 4), "Ofertas en tu carrera (N)" con todas las
   ofertas disponibles de mi carrera, filtro por materia en chips con su cantidad y "Mostrar N
   más" de a 8, Avisos, "Cómo funciona" (3 pasos) y un espacio de anuncio.
4. **Buscar**: filtros por materia, día y "solo coincidencias"; tarjetas de oferta ordenadas
   por disponibles, match, me sirve; confirmación antes de marcar interés.
5. **Publicar**: materia, grupo, "Lo que tienes" (una franja), "Lo que buscas" (varias) y un
   comentario opcional. Cada franja: chips de días y un **selector de rango de hora**: dos
   píldoras "Desde" / "Hasta" que muestran la hora (`7:00 a.m.`); al tocar una se despliega con
   resorte un panel con tres ruedas (hora 1-12, minutos de 5 en 5, a.m./p.m.) y el botón
   "Listo". Usa `Picker` con `.pickerStyle(.wheel)` (tres columnas) o una rueda propia con
   `ScrollView` + `.scrollTargetBehavior(.viewAligned)`, la que se vea más fiel: ítem central
   al 100 %, los demás al 25 % de opacidad y 82 % de escala, banda central en píldora y
   `.sensoryFeedback(.selection)` al pasar cada ítem. Debajo, la duración ("1 h 30 min de clase").
6. **Mis cambios**: mis ofertas y aquellas donde marqué interés; ver contacto, confirmar,
   liberar, retirar.
7. **Perfil**: datos, contacto visible (toggles), historial, interruptor de tema y cerrar sesión.

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
  → `.bottomTrailing`) que ignora las áreas seguras, con texto onBackground encima. Las tarjetas
  son surface.
- Tipografía: **Poppins SemiBold** para títulos, **Inter** Regular/Bold para el texto (inclúyelas
  en el bundle y regístralas en `Info.plist`), escaladas con `relativeTo:` para Dynamic Type.
  Escala: título de pantalla 28/34 (32/38 en iPad), sección 20/26, tarjeta 16/22, cuerpo 16/22,
  secundario 13.5/18, insignia Inter Bold 11 con tracking 0.6. Nada de mayúsculas sostenidas.
- Espaciado en base 8: 4, 8, 16, 24, 32, 40. Radios (siempre `.continuous`): control 12, tarjeta
  16 (las tarjetas usan 20), panel 28, píldora `Capsule`. Táctil mínimo 44 pt.
- **Cristal** (regla de la marca, inspirada en alburastudio.com): superficies flotantes,
  translúcidas y redondeadas que dejan ver el degradado, solo con los colores de arriba:
  - Barra de pestañas propia (oculta la `TabView` estándar o usa un `safeAreaInset(edge: .bottom)`):
    **dock flotante** en `Capsule`, a 12 pt de los bordes y sobre el home indicator, 64 pt de
    alto, con `.ultraThinMaterial` y encima `surface` al 80 %, borde de 1 pt `border` al 90 % y
    sombra (radio 20, y 18, negro al 35 %). El contenido se desplaza por debajo.
  - Ítems: SF Symbols `house`, `magnifyingglass`, `plus.circle`, `arrow.left.arrow.right`,
    `person` (`.fill` para el activo); etiqueta de 11 pt; el activo lleva una cápsula
    `primaryTint` detrás del ícono y color `link`. "Publicar" es una cápsula `primary` con "+".
    "Mis cambios" muestra un contador amarillo (accent, texto `#0A2959`) con los avisos sin leer.
    Transición del indicador con `matchedGeometryEffect`.
  - En iPad en horizontal usa la píldora superior: material oscuro con `backgroundEnd` al 72 %,
    logo + "USC" en blanco + "upo" en amarillo, pestañas en cápsula (la activa con blanco al 12 %
    y su ícono en amarillo), interruptor de tema y un avatar amarillo con la inicial.
- Movimiento: `.spring(response: 0.35, dampingFraction: 0.9)` para la interfaz y
  `.spring(response: 0.3, dampingFraction: 0.7)` para el interruptor de tema. Todo se puede
  interrumpir. Respeta `accessibilityReduceMotion` (cambia a fundido).
- Anuncios: un banner adaptable de AdMob por pantalla como máximo, con la etiqueta
  "Publicidad", nunca en Publicar ni pegado a un botón.

## Calidad mínima

- VoiceOver con etiquetas en español, contraste AA y que Dynamic Type hasta XXL no rompa el diseño.
- Estados vacíos y de error en el tono de la web: dicen qué pasó y qué hacer, sin disculpas.
- Sin claves ni contraseñas en el código. Credenciales de prueba solo en el `.xcconfig` local.

## Cómo trabajamos

1. Primero propón el plan: estructura de carpetas, paquetes SPM con versiones y el orden de las
   pantallas. Espera mi visto bueno.
2. Construye por pantallas, en este orden: tema → auth → Inicio → Publicar → Buscar → Mis
   cambios → Perfil → anuncios.
3. Después de cada pantalla, compila, ejecútala en el simulador y dime qué probaste.
4. No hagas commit ni push hasta que yo lo diga.
