# Prompt: app Android de USCupo (Android Studio)

Copia todo lo que está debajo de la línea y pégalo como primer mensaje en Claude dentro de
Android Studio, con un proyecto vacío abierto ("Empty Activity", Kotlin, Compose).

---

Vas a construir la app Android nativa de **USCupo**. La web ya existe y funciona; la app es su
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

- Kotlin, Jetpack Compose, Material 3 como base técnica **pero con el tema de USCupo**
  (no el look por defecto de Material). minSdk 26, targetSdk el más reciente estable.
- Arquitectura MVVM por capas: `data/` (repositorios Supabase, modelos), `domain/` (reglas
  puras: match recíproco, días restantes, formato de horas), `ui/` (pantallas + ViewModels
  con `StateFlow`). Inyección con Hilt.
- Backend: **Supabase ya existente** con `supabase-kt` (módulos `postgrest-kt`, `auth-kt`,
  `functions-kt`) + Ktor. URL y anon key en `local.properties` → `BuildConfig`; nunca en el
  código ni en git. **No modifiques el esquema**: si hace falta un cambio en la base de
  datos, propónme la migración SQL y espera.
- Navigation Compose; DataStore para la preferencia de tema; Coil si hace falta imagen.
- Cristal: [Haze](https://github.com/chrisbanes/haze) para el desenfoque de fondo.
- Anuncios: Google Mobile Ads SDK (AdMob) + UMP para el consentimiento. **Solo ids de
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
  si ya escribieron el correo; flujo PKCE en Custom Tabs; deep link `uscupo://auth/callback`.
  Avísame qué URL de retorno debo añadir en Supabase → Authentication → URL Configuration.
- Tras entrar: si el perfil no tiene carrera, pantalla "Completar perfil"; si no, pestañas.

## Pantallas (mismo contenido y textos que la web)

1. **Login / Crear cuenta**: segmentado entre los dos modos; nombre, correo, carrera (lista
   agrupada por facultad, con búsqueda), contraseña; botón "Continuar con Microsoft".
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
   resorte un panel con tres ruedas (hora 1-12, minutos de 5 en 5, a.m./p.m.). El ítem central
   se ve al 100 % y los demás bajan a 25 % de opacidad y 82 % de escala según su distancia;
   encaje por ítem, banda central en píldora, botón "Listo". Debajo, la duración ("1 h 30 min
   de clase"). Una rueda = `LazyColumn` + `rememberSnapFlingBehavior`, con háptico suave al
   pasar cada ítem.
6. **Mis cambios**: mis ofertas y aquellas donde marqué interés; ver contacto, confirmar,
   liberar, retirar.
7. **Perfil**: datos, contacto visible (interruptores), historial, interruptor de tema y
   cerrar sesión.

## Identidad visual (respétala exactamente)

Colores. El modo oscuro cambia los valores, no el diseño; mismos nombres:

| Token | Claro | Oscuro |
| --- | --- | --- |
| background (inicio del degradado) | `#0A2959` | `#061733` |
| backgroundEnd (fin del degradado) | `#08234B` | `#030C1E` |
| onBackground | `#FFFFFF` | `#F2F5FA` |
| onBackgroundMuted | `rgba(255,255,255,0.76)` | `rgba(242,245,250,0.72)` |
| onBackgroundBorder | `rgba(255,255,255,0.18)` | `rgba(242,245,250,0.14)` |
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

- Fondo de toda pantalla: degradado diagonal background → backgroundEnd (arriba-izquierda a
  abajo-derecha), con texto onBackground encima. Las tarjetas son surface.
- Tipografía: **Poppins SemiBold** para títulos, **Inter** Regular/Bold para el texto (inclúyelas
  en `res/font`). Escala: título de pantalla 28/34 (32/38 en tablet), sección 20/26, tarjeta
  16/22, cuerpo 16/22, secundario 13.5/18, insignia Inter Bold 11 con tracking 0.6. Nada de
  mayúsculas sostenidas en etiquetas.
- Espaciado en base 8: 4, 8, 16, 24, 32, 40. Radios: control 12, tarjeta 16 (las tarjetas usan
  20), panel 28, píldora 999. Táctil mínimo 48 dp.
- **Cristal** (regla de la marca, inspirada en alburastudio.com): superficies flotantes,
  translúcidas y redondeadas que dejan ver el degradado. Solo con alfa de los colores de arriba:
  - Barra de navegación: **dock flotante inferior** en píldora (radio 999), a 12 dp de los
    bordes y por encima del inset de gestos, 64 dp de alto, con fondo `surface` al 80 %,
    desenfoque Haze de 14 dp, borde de 1 dp `border` al 90 % y sombra suave (0, 18, 40, -24,
    negro al 80 %). El contenido se desplaza por debajo y reserva ese alto al final.
  - Ítems del dock: ícono + etiqueta de 11 sp; el activo lleva una cápsula `primaryTint`
    detrás del ícono y color `link`. "Publicar" es una cápsula `primary` con "+". "Mis
    cambios" muestra un contador amarillo (accent, texto `#0A2959`) con los avisos sin leer.
  - En tablets en horizontal (≥ 1024 dp) usa la píldora superior: fondo `backgroundEnd` al
    72 % con desenfoque, logo + "USC" en blanco + "upo" en amarillo, pestañas en píldora (la
    activa con blanco al 12 % y su ícono en amarillo), interruptor de tema y un avatar amarillo
    con la inicial.
- Movimiento: resortes sin rebote para la interfaz (`dampingRatio` ≈ 0.8 y `stiffness` ≈ 260
  como equivalente aproximado); el interruptor de tema tiene un rebote leve. Respeta "quitar
  animaciones" del sistema.
- Íconos: Material Symbols Outlined (relleno para el activo), equivalentes a los Ionicons de la
  web: home, search, add-circle, swap-horizontal, person.
- Anuncios: un banner adaptable de AdMob por pantalla como máximo, con la etiqueta
  "Publicidad", nunca en Publicar ni pegado a un botón.

## Calidad mínima

- Accesibilidad: `contentDescription` en todo control con solo ícono, contraste AA, y que la
  letra grande del sistema no rompa el diseño.
- Estados vacíos y de error en el tono de la web: dicen qué pasó y qué hacer, sin disculpas.
- Sin claves ni contraseñas en el código. Credenciales de prueba solo en `local.properties`.

## Cómo trabajamos

1. Primero propón el plan: módulos, paquetes, dependencias con versiones y el orden de las
   pantallas. Espera mi visto bueno.
2. Construye por pantallas, en este orden: tema → auth → Inicio → Publicar → Buscar → Mis
   cambios → Perfil → anuncios.
3. Después de cada pantalla, compila, ejecútala en el emulador y dime qué probaste.
4. No hagas commit ni push hasta que yo lo diga.
