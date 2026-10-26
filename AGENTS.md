# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Regla de diseño: superficies de cristal

Inspiración: https://alburastudio.com/ (navbar redondeada y cristalina). No cambia la paleta USC
de `src/theme/colors.ts`; solo usa variantes con transparencia de esos mismos colores.

- Tokens en `src/theme/glass.ts`: `glass` (radios, blur, alturas), `cristalOscuro`, `cristalClaro`, `conAlfa`.
- Navbar flotante: píldora superior en computador (≥1024 px), dock inferior en teléfono/tablet.
  `Pantalla` reserva su alto; cualquier pantalla nueva de pestañas debe usar `Pantalla`.
- Receta: radio 999 (píldora) o 28 (panel), fondo del color de la paleta con alfa ~0.72–0.85,
  `backdrop-filter: blur(14px)`, borde 1 px de baja opacidad, sombra `0 18px 40px -24px rgba(0,0,0,.8)`.
- Este repo es solo la web. Las apps nativas (Kotlin / Swift) siguen los mismos tokens: prompts en
  `docs/prompts/` (Haze en Android, `.ultraThinMaterial` en iOS para el cristal).
- `docs/` es privada: git la ignora y solo existe en la máquina del autor. Nunca la subas.
- Anuncios: `EspacioAnuncio` (AdSense). Paso a paso y AdMob para las apps: `docs/google-ads.md`.
