# Prompt: poner la app Android a la par de la web (octubre 2026)

Copia todo lo que está debajo de la línea y pégalo en Claude dentro de Android Studio, con el
proyecto `USCupoAndroid` abierto. Revisión hecha el 2026-10-26 comparando la rama `master` de
Android (último commit `22cf552`) con la web en producción (https://www.uscupo.com).

---

La web de USCupo avanzó y la app Android quedó atrás en varias cosas. Ponla a la par sin cambiar
la identidad visual (colores de `theme/Colores.kt`, cristal de `theme/Cristal.kt`, tipografía y
movimiento actuales) ni la arquitectura (MVC con `controller/`, `model/`, `view/`, Hilt,
supabase-kt 3.8). Los textos van **idénticos** a la web; cópialos tal cual de aquí. Haz un commit
por punto y, antes de cada uno, compila y prueba en el emulador. Si algo no está claro,
pregúntame antes de decidir.

## 1. Dominio nuevo (rápido, primero)

La web se mudó de `uscupo.vercel.app` (ya eliminado) a **https://www.uscupo.com**.

- `model/legal/Legal.kt:8`: `URL_WEB = "https://www.uscupo.com"`. Revisa que Términos,
  Privacidad y Eliminar cuenta se armen a partir de esa constante.
- Agrega `URL_PREGUNTAS = "$URL_WEB/preguntas"` y un enlace **"Preguntas frecuentes"** en
  Perfil → "Acerca de USCupo", antes de "Términos de uso".
- No cambies `VERSION_LEGAL` (sigue `2026-10-24.4`, igual que la web): solo cambió la dirección,
  no el texto.
- Avísame al terminar para actualizar en Google Play Console el sitio web y la URL de la política
  de privacidad (`https://www.uscupo.com/privacidad`).

## 2. Anuncios solo en pantallas con contenido (política de Google)

AdSense rechazó la web por "anuncios en pantallas sin contenido de publicadores", y AdMob aplica
la misma regla. Hoy `BannerAnuncio` sale aunque la pantalla esté vacía:

- `view/perfil/PerfilScreen.kt:97`: **quítalo**. Perfil es una pantalla de ajustes.
- `view/miscambios/MisCambiosScreen.kt:106`: hoy sale también con "Aún no tienes cambios en
  curso". Muéstralo solo si hay al menos una oferta (mías o donde marqué interés).
- `view/buscar/BuscarScreen.kt:135` y `:161`: solo si hay resultados (`s.resultados` no vacío);
  nunca junto a `SinResultados`.
- `view/inicio/InicioScreen.kt:111` y `:135`: solo si hay coincidencias u ofertas de la carrera.
  Nunca en el estado "Aún no hay un cambio exacto para ti" sin ofertas debajo.
- Nunca durante el esqueleto, en un error ni sin conexión.

## 3. Confirmación de correo y "Reenviar correo de confirmación"

En Supabase se activó **Confirm email**: `signUp` ya no devuelve sesión.

- Tras crear la cuenta: "Cuenta creada. Abre el enlace que enviamos a {correo} para confirmarla
  y luego inicia sesión." (revisa que `LoginController` ya lo muestre cuando no hay sesión).
- Si al iniciar sesión el error es "Email not confirmed": "Confirma tu cuenta desde el enlace
  que enviamos a tu correo institucional."
- En los dos casos, debajo del aviso, un `Boton` secundario **"Reenviar correo de
  confirmación"** que llama `auth.resendEmail(OtpType.Email.SIGNUP, correo)`. Después espera
  60 s ("Reenviar confirmación en N s", deshabilitado) y muestra "Enviamos otro enlace a
  {correo}. Revisa también el correo no deseado."

## 4. "¿Olvidaste tu contraseña?" y Recuperar contraseña

- En `view/login/LoginScreen.kt`, solo en el modo "Iniciar sesión": un enlace **"¿Olvidaste tu
  contraseña?"** alineado a la derecha, justo debajo del campo de contraseña (`Enlace`, color
  `link`, Inter Bold). Navega a una pantalla nueva **Recuperar contraseña** y le pasa el correo
  ya escrito.
- Pantalla nueva (`view/recuperar/`, `controller/RecuperarController.kt`) con el mismo marco del
  login (degradado, tarjeta de cristal) y una insignia redonda de 52 dp con el ícono de correo
  en `accentText` sobre `accentTint`:
  - **Formulario**: "Recupera tu contraseña" / "Escribe tu correo institucional y te enviamos un
    enlace para crear una nueva." / campo "Correo institucional" (valida `@usc.edu.co` con
    `model/reglas/Validacion.kt`) / botón "Enviar enlace" ("Enviando…") / aviso: "Si entras con
    tu cuenta de Microsoft, tu contraseña es la de la USC y se cambia en Microsoft 365." / pie
    "¿La recordaste? **Inicia sesión**" (vuelve atrás).
  - Llama `auth.resetPasswordForEmail(correo, redirectUrl = "https://www.uscupo.com/restablecer")`.
  - **Enviado**: "Revisa tu correo" / "Si hay una cuenta de USCupo con **{correo}**, te llegará
    un enlace para crear una contraseña nueva. El enlace vence en una hora." / "¿No llega? Revisa
    la carpeta de correo no deseado." / botón secundario "Reenviar enlace" ("Reenviar en N s"
    durante 60 s) / "Usar otro correo" / "¿La recordaste? Inicia sesión".
- Errores nuevos en `model/reglas/MensajesError.kt`:
  - contiene "email rate limit" → "Ya enviamos varios correos en la última hora. Espera un rato
    antes de pedir otro enlace."
  - contiene "for security purposes" → "Espera un minuto antes de pedir otro enlace."
  - contiene "email address not authorized" → "Por ahora no podemos enviar correos a esa
    dirección. Escríbenos desde Contacto y te ayudamos."
- **El enlace del correo abre la web** (`https://www.uscupo.com/restablecer?token_hash=…`), que
  ya cambia la contraseña en cualquier dispositivo. No lo interceptes en esta versión. Si después
  quieres abrirlo dentro de la app (App Links), la web debe publicar
  `/.well-known/assetlinks.json` con el SHA-256 de la firma: dímelo y lo agrego en la web.

## 5. "Mantener sesión iniciada" (30 días)

En la web, sin la casilla la sesión dura lo que dure la pestaña. En Android la equivalencia es
**lo que dure el proceso de la app**:

- Casilla en "Iniciar sesión", debajo de "¿Olvidaste tu contraseña?", **desmarcada** por
  defecto. Título "Mantener sesión iniciada" y debajo, en secundario, "30 días en este equipo.
  Si no la marcas, la sesión se cierra al cerrar la app." Usa el mismo componente de casilla de
  `view/componentes/Legal.kt` (sácalo a un `Casilla` genérico si hace falta). Aplica también al
  botón de Microsoft: guarda la elección antes de abrir la Custom Tab.
- En `di/SupabaseModule.kt`, dentro de `install(Auth)`, pon un `sessionManager` propio que
  delegue:
  - marcada: al almacenamiento persistente actual, más `recordarHasta = ahora + 30 días` en
    `PreferenciasRepository` (DataStore);
  - desmarcada: solo en memoria (`MemorySessionManager`).
  - El `codeVerifierCache` sigue siendo persistente siempre: Android puede matar la app mientras
    el usuario está en Microsoft.
- Al arrancar y al volver a primer plano (`ProcessLifecycleOwner`, `ON_START`), si
  `recordarHasta` ya pasó, borra la sesión guardada y la fecha y cierra la sesión local. El
  controlador de sesión (`SesionController`) lleva al login como hoy.
- Las sesiones abiertas antes de esta versión (guardadas sin fecha) se respetan 30 días desde la
  primera apertura con la versión nueva, para no sacar a nadie de golpe.
- Al cerrar sesión, borra también `recordarHasta`.
- Tests unitarios del delegado: sin casilla no persiste; con casilla persiste y vence a los 30
  días exactos; una sesión antigua recibe 30 días.

## 6. Liberar con la RPC

`model/repositorios/OfertasRepository.kt:127` hace un `update` directo. Funciona (el trigger
`proteger_oferta` permite `en_proceso → disponible` sin interesado), pero la web ya usa la RPC,
que valida dueño y estado en el servidor:

```kotlin
override suspend fun liberar(id: Long) {
    rpcOferta("liberar_oferta", id)
}
```

Si la oferta ya no estaba en proceso, la RPC falla con "Esta oferta ya no está en proceso.
Actualizamos la lista."; tradúcelo a `OfertaYaNoEnProceso` para conservar el mensaje y la
recarga actuales.

## 7. Aviso al reportar una oferta en proceso

`controller/ModeracionController.kt:84` siempre dice "…y ya no la verás.". Si la oferta
reportada es una en la que **yo** marqué interés (`estado == en_proceso`), la RLS la deja visible
para mí, así que el aviso debe ser solo **"Gracias por avisar. Revisaremos la oferta."**. Igual
que la web (`src/controllers/estadoModeracion.ts`). Agrega un test.

## Lo que NO hay que hacer

- No cambies colores, tipografía, formas ni animaciones.
- No toques Supabase (tablas, RLS, plantillas de correo): ya está configurado para la web y la
  app. El SMTP es Resend con el dominio `uscupo.com`.
- La portada pública, `/preguntas` y la precarga de pestañas son de la web; Android no las
  necesita.
- El login con Microsoft sigue esperando la aprobación de la USC: no lo des por roto.

## Al terminar

Dame una lista de lo hecho con el commit de cada punto, lo que probaste en el emulador y lo que
quede pendiente (por ejemplo, actualizar la ficha de Google Play).
