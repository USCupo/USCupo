// Identidad corporativa USC (2026-10-22).
//   Azul nativo   #0A2959  logo, títulos, fondos y texto
//   Azul oscuro   #08234B  degradado del fondo
//   Azul neutro   #165487  botones y enlaces
//   Amarillo      #D4AF37  textos destacados, logo y acentos sobre azul
//   Amarillo osc. #7A5A00  texto destacado sobre blanco
//   Blanco        #FFFFFF  formularios y tarjetas
// El modo oscuro es un cambio de tema, no un rediseño: mismos nombres, distinto valor.

export const usc = {
  azulNativo: '#0A2959',
  azulOscuro: '#08234B',
  azulNeutro: '#165487',
  amarillo: '#D4AF37',
  amarilloOscuro: '#7A5A00',
  blanco: '#FFFFFF',
} as const;

export const lightColors = {
  // Fondo de pantalla: degradado azul nativo → azul oscuro, con texto blanco encima.
  background: usc.azulNativo,
  backgroundEnd: usc.azulOscuro,
  onBackground: usc.blanco,
  onBackgroundMuted: 'rgba(255,255,255,0.76)',
  onBackgroundBorder: 'rgba(255,255,255,0.18)',

  // Formularios y tarjetas.
  surface: usc.blanco,
  text: usc.azulNativo,
  textMuted: '#4F6080',
  border: '#D5DEEA',

  // Botones y enlaces.
  primary: usc.azulNeutro,
  onPrimary: usc.blanco,
  link: usc.azulNeutro,
  primaryTint: '#E8EFF7',

  // Acentos.
  accent: usc.amarillo,
  accentText: usc.amarilloOscuro,
  accentTint: '#FBF5E1',

  danger: '#B3271E',
} as const;

export const darkColors = {
  background: '#061733',
  backgroundEnd: '#030C1E',
  onBackground: '#F2F5FA',
  onBackgroundMuted: 'rgba(242,245,250,0.72)',
  onBackgroundBorder: 'rgba(242,245,250,0.14)',

  surface: '#0D2142',
  text: '#EAF0F8',
  textMuted: '#A3B3CC',
  border: '#22385E',

  // Azul neutro un punto más claro para que el botón se separe de la tarjeta oscura.
  primary: '#1E62A0',
  onPrimary: usc.blanco,
  link: '#8DBBEA',
  primaryTint: '#15305A',

  accent: usc.amarillo,
  accentText: '#E2C25E',
  accentTint: '#2A2410',

  danger: '#F2887E',
} as const;

export type ThemeColors = { readonly [K in keyof typeof lightColors]: string };
