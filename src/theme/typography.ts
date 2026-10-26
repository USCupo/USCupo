import { Platform } from 'react-native';

// En web cada familia (la registra app/_layout.tsx) lleva detrás un respaldo local con métricas
// ajustadas (@font-face en app/+html.tsx), para que el cambio a la real no mueva la página, y
// sans-serif por si el equipo no tiene ninguna. En nativo fontFamily es un solo nombre.
const familia = (nombre: string, respaldo: string) => Platform.select({ web: `${nombre}, ${respaldo}, sans-serif`, default: nombre });

export const fonts = {
  heading: familia('Poppins_600SemiBold', 'PoppinsRespaldo'),
  body: familia('Inter_400Regular', 'InterRespaldo'),
  bodyBold: familia('Inter_700Bold', 'InterRespaldoBold'),
} as const;

export const typeScale = {
  screenTitle: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 34 },
  sectionTitle: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26 },
  cardTitle: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bodyMuted: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 18 },
  badge: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6 },
} as const;
