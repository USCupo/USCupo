# USCupo

Aplicación web (Expo Router + React Native Web, desplegada en Vercel) para que estudiantes
de la Universidad Santiago de Cali intercambien horarios/cupos de materias entre sí.
Las apps nativas se construirán aparte (Kotlin y Swift) sobre el mismo backend: ver
`docs/prompts/`.
USCupo solo conecta estudiantes: el trámite del cambio se hace directamente en la
universidad.

## Stack

- **Frontend:** Expo Router (SDK 57) + React Native Web, exportado como SPA estática
- **Backend/BD:** Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- **Auth:** correo institucional `@usc.edu.co` + contraseña, o Microsoft 365 (Entra ID) restringido al
  mismo dominio

## Estructura

```
app/                   Vistas (Expo Router)
  (auth)/login.tsx      Registro / inicio de sesión
  (tabs)/               Inicio, Buscar, Publicar, Mis cambios, Perfil
src/
  models/               Tipos + queries a Supabase por tabla
  controllers/           Lógica de negocio (auth.ts; matching/notificaciones/expiración llegan
                          con sus pantallas)
  components/            Componentes del design system (Button, TextField, CarreraPicker…)
  theme/                 Tokens de color/tipografía/espaciado y material "cristal" (glass.ts)
  lib/                   Cliente de Supabase + contexto de sesión
docs/
  google-ads.md          Paso a paso de AdSense (web) y AdMob (apps)
  prompts/               Prompts para construir las apps Android (Android Studio) e iOS (Swift)
supabase/
  migrations/            Esquema, RLS, funciones de dominio y datos semilla
  functions/expirar-ofertas/  Edge Function que vence ofertas sin confirmar a los 7 días
```

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `.env.example` a `.env` y completa `EXPO_PUBLIC_SUPABASE_URL` y
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API).

### 2. Aplicar el esquema

Con la [Supabase CLI](https://supabase.com/docs/guides/cli) enlazada al proyecto:

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

O, si prefieres no instalar la CLI todavía, pega el contenido de cada archivo en
`supabase/migrations/` (en orden) en el SQL Editor del dashboard de Supabase.

Esto crea las tablas, las políticas de RLS, las funciones (`expresar_interes`,
`contacto_revelado`, `confirmar_cambio`, `buscar_matches`) y los datos semilla: el
catálogo completo de carreras de la USC (pregrado/técnico/posgrado, tomado de
usc.edu.co) y el pénsum completo de Ingeniería de Sistemas. Las demás carreras quedan
sin materias hasta que se carguen sus pénsums (ver nota en
`20260921000005_seed_materias_ingenieria_sistemas.sql`).

### 3. Configurar autenticación

- **Email:** Authentication → Providers → Email. Se recomienda dejar la confirmación de
  correo activada (el trigger de base de datos ya rechaza cualquier dominio distinto a
  `@usc.edu.co`, así que solo estudiantes reales llegan a confirmar).
- **Microsoft 365 (cuentas USC):** la USC usa Microsoft Entra ID
  (tenant `47e962fd-bc3b-4eed-b1b8-d70eee9acd65`).
  1. En portal.azure.com → Microsoft Entra ID → App registrations → New registration.
     Redirect URI tipo *Web*: `https://<project-ref>.supabase.co/auth/v1/callback`.
  2. Crea un client secret (copia el *Value*) y anota su vencimiento.
  3. En Supabase → Authentication → Providers → Azure: Client ID, Secret y
     *Azure Tenant URL* = `https://login.microsoftonline.com/47e962fd-bc3b-4eed-b1b8-d70eee9acd65`.
  4. Recomendado: en el Manifest de la app agrega los optional claims `email` y `xms_edov`.
  La app pide `domain_hint=usc.edu.co`, así que entra directo a la cuenta institucional;
  el trigger `handle_new_user` sigue rechazando cualquier otro dominio.
- **Redirect URLs** (Authentication → URL Configuration):
  `http://localhost:8081/auth/callback` (desarrollo) y el dominio de producción (paso 6).
  Las apps nativas añadirán `uscupo://auth/callback`.

### 4. Programar la expiración automática

```bash
supabase functions deploy expirar-ofertas
```

Luego crea un cron job (Database → Cron Jobs en el dashboard, o `pg_cron` + `pg_net`) que
llame a la función una vez al día.

### 5. Correr en local

```bash
npm install
npm start          # http://localhost:8081
npm run typecheck
npm run build      # export estático a dist/, igual que en Vercel
```

Si el proyecto está dentro de OneDrive y Metro no detecta cambios, reinicia con
`npx expo start --web --clear`.

### 6. Deploy web en Vercel

El repo ya trae `vercel.json` (build `npx expo export -p web`, salida `dist/`, y rewrite
de todas las rutas a `index.html` porque es una SPA).

1. En Vercel: **Add New → Project** → importar este repositorio de GitHub. Framework
   preset: **Other** (lo demás lo toma de `vercel.json`).
2. **Environment Variables** (Production y Preview), con los mismos valores del `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

   Se incrustan en el bundle al compilar: si se cambian, hay que volver a desplegar.
   Son públicas por diseño (la seguridad la da RLS); **nunca** pongas aquí la
   `service_role` key.
3. **Deploy.**
4. En Supabase → Authentication → URL Configuration:
   - **Site URL**: el dominio de producción, p. ej. `https://uscupo.vercel.app`
     (los enlaces de confirmación de correo apuntan aquí).
   - **Redirect URLs**: agrega `https://uscupo.vercel.app/**` y, para los previews,
     `https://*-<equipo>.vercel.app/**`.

## Estado actual

Web funcional: registro/login con correo institucional, completar perfil, Inicio
(coincidencias, todas las ofertas de la carrera, avisos, espacio de anuncio), Buscar
(filtros, "me interesa"), Publicar (horario con hora libre en ruedas), Mis cambios
(contacto, confirmar/liberar/retirar) y Perfil (contacto visible, historial, tema
claro/oscuro). Pénsums cargados para las 89 carreras del catálogo.
Pendiente: Microsoft 365 (código listo, falta configurar Azure) y activar AdSense
(`docs/google-ads.md`).
