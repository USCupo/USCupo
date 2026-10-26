# Desarrollo y despliegue de USCupo (web)

Guía para quien mantiene el proyecto. La presentación pública está en el [README](../README.md).

## Stack

- **Frontend:** Expo Router (SDK 57) + React Native Web, exportado como HTML estático por ruta
  (`web.output: "static"`) con rutas asíncronas
- **Backend/BD:** Supabase (Postgres, Auth, Row Level Security, pg_cron)
- **Auth:** correo institucional `@usc.edu.co` + contraseña, o Microsoft 365 (Entra ID) restringido al
  mismo dominio

## Estructura

```
app/                   Vistas (Expo Router)
  (auth)/login.tsx      Registro / inicio de sesión
  (tabs)/               Inicio, Buscar, Publicar, Mis cambios, Perfil
src/
  models/               Tipos + queries a Supabase por tabla
  controllers/           Lógica de cada pantalla (hooks use*Controller) y de autenticación
  components/            Componentes del design system (Button, TextField, CarreraPicker…)
  theme/                 Tokens de color/tipografía/espaciado y material "cristal" (glass.ts)
  lib/                   Cliente de Supabase, sesión (sesion.ts) y Markdown para agentes
middleware.ts            Routing Middleware de Vercel: responde Markdown con Accept: text/markdown
tests/                   Tests con node --test (npm test)
docs/
  google-ads.md          Paso a paso de AdSense (web) y AdMob (apps)
  prompts/               Prompts para construir las apps Android (Android Studio) e iOS (Swift)
supabase/
  migrations/            Esquema, RLS, funciones de dominio y datos semilla
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

### 4. Expiración automática

La migración `20261024000001_expirar_ofertas_cron.sql` programa con pg_cron, cada hora, la función
`expirar_ofertas()`: pasa a `expirada` las ofertas en proceso sin confirmar a los 7 días y avisa al
dueño. No hay Edge Functions que desplegar.

### 5. Correr en local

```bash
npm install
npm start          # http://localhost:8081
npm run typecheck
npm test
npm run build      # export estático a dist/
```

Si el proyecto está dentro de OneDrive y Metro no detecta cambios, reinicia con
`npx expo start --web --clear`.

### 6. Deploy web en Vercel

El repo ya trae `vercel.json`: build `npx expo export -p web` + `404.html` + verificación de la
CSP (`scripts/verificar-csp.mjs`), salida `dist/`, cabeceras de seguridad y redirects.

1. En Vercel: **Add New → Project** → importar este repositorio de GitHub. Framework
   preset: **Other** (lo demás lo toma de `vercel.json`).
2. **Environment Variables** (Production y Preview), con los mismos valores del `.env`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_ADSENSE_CLIENT` y `EXPO_PUBLIC_ADSENSE_SLOT_INICIO` (ver `docs/google-ads.md`)

   Se incrustan en el bundle al compilar: si se cambian, hay que volver a desplegar.
   Son públicas por diseño (la seguridad la da RLS); **nunca** pongas aquí la
   `service_role` key.
3. **Deploy.**
4. Correo: SMTP propio con Resend (dominio `uscupo.com`) en Authentication → Emails → SMTP
   Settings; plantilla "Reset Password" con enlace a `{{ .SiteURL }}/restablecer?token_hash={{ .TokenHash }}&type=recovery`.
5. En Supabase → Authentication → URL Configuration:
   - **Site URL**: el dominio de producción, `https://www.uscupo.com`
     (los enlaces de confirmación de correo apuntan aquí).
   - **Redirect URLs**: agrega `https://www.uscupo.com/**`, `http://localhost:8081/**` y, para
     los previews, `https://*-<equipo>.vercel.app/**`.
