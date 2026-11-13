# juandelagua.com

Sitio de **Juan del Agua**: consultor de IA y marketing para empresas y pymes en Chile.
Astro: páginas de marketing pre-generadas (estáticas) + servidor Node para las rutas dinámicas. Docker, pensado para EasyPanel.

## Trabajar en local

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
npm run preview    # sirve el build
```


## Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| WhatsApp, redes, textos base, menú, método, certificaciones, agenda del diagnóstico (`bookingUrl`, Google Calendar), comunidad (`COMMUNITY`), valores y manifiesto | `src/data/site.ts` |
| **Precios**, orden de los planes, cupos de lanzamiento (`LAUNCH.left`), condiciones comerciales | `src/data/planes.ts` |
| Preguntas frecuentes | `src/data/faq.ts` |
| Casos de clientes | `src/content/casos/*.md` (ver `LEEME.txt`) |
| Colores, tipografía, botones, tarjetas | `src/styles/global.css` |
| Cada página | `src/pages/*.astro` (la ruta = el nombre del archivo) |
| SEO global, schema (JSON-LD), Open Graph | `src/layouts/Base.astro` |
| Fotos | `src/assets/img/` (Astro las optimiza a AVIF/WebP) |
| Animaciones de agua ligadas al scroll | `src/scripts/fx.ts`, `src/components/Wave.astro`, `src/components/WaterCanvas.astro` |
| Imagen para compartir (OG) y favicon | `public/og.jpg`, `public/favicon.svg` → regenerar con `node scripts/make-images.mjs` |

## Páginas

**Marketing (pre-generadas, estáticas):** `/` · `/planes` · `/consultor-ia` (incluye el método) · `/marketing-digital` · `/casos` · `/comunidad` (página pública de ingreso) · `/sobre-mi` · `/contacto` · `/privacidad` · `/cookies` · `/terminos` · `404`

**Servidor (Supabase):**

| Área | Rutas |
|---|---|
| Blog (público, indexable) | `/blog`, `/blog/[slug]`, `/blog/categoria/[slug]`, `/blog/serie/[serie]`, `/blog/rss.xml`, `/sitemap-blog.xml` |
| Cuentas | `/entrar`, `/registro`, `/recuperar`, `/restablecer`, `/salir`, `/auth/callback`, `/auth/google`, `/cuenta`, `/cuenta/exportar` |
| Comunidad (privada, noindex) | `/comunidad/ingreso`, `/comunidad/feed`, `/comunidad/p/[id]`, `/comunidad/cursos/...`, `/comunidad/calendario`, `/comunidad/miembros`, `/comunidad/ranking`, `/comunidad/u/[usuario]`, `/comunidad/notificaciones` |
| Administración | `/comunidad/admin` (resumen, solicitudes, reportes, miembros y roles, cursos, eventos, ajustes), `/admin/blog` |
| API interna | `/api/sesion`, `/api/blog/ultimos`, `/api/comunidad/accion`, `/api/comunidad/admin` |

## Backend (Supabase)

- **Base de datos:** migraciones en `supabase/migrations/` (en orden), datos de ejemplo en `supabase/seed.sql`.
- **Ingreso:** inmediato (al confirmar el correo se entra a la comunidad). Se puede volver a revisión manual desde el panel de administración.
- **Permisos:** RLS en todas las tablas. Rol (`owner`, `admin`, `moderator`, `member`) y membresía (`free`, `founder`, `paid`, `comp`) son independientes.
  Rol, estado, membresía y puntos **no** se pueden editar directo: solo con las funciones `set_member_role`, `set_member_status`, `set_member_membership` y `adjust_points`, que validan permisos y dejan registro en `audit_log`.
- **Gamificación:** cada me gusta recibido suma 1 punto (`points_ledger`), con 9 niveles editables; los niveles desbloquean cursos.
- **Sesión:** `@supabase/ssr` con cookies httpOnly, leída en `src/middleware.ts` (`Astro.locals.user`, `Astro.locals.profile`).
- **Formularios:** POST normales (sin framework de JS), con protección CSRF de Astro (`security.checkOrigin`).
- **Blog programado:** un artículo con estado "Programado" se vuelve visible solo cuando llega su hora (lo filtra la RLS). `deploy/blog-worker.mjs` avisa a IndexNow cada 5 minutos.

### Puesta en marcha (una vez)

1. **Proyecto Supabase:** ya creado (`ncxfhcxhfatlkqizmass`, región us-west-2 / Oregón, la que declara la política de privacidad) y con las migraciones y el seed aplicados. Si algún día se cambia de región, actualizar `/privacidad`.
2. **Aplicar las migraciones**: en el SQL Editor, pegar y ejecutar cada archivo de `supabase/migrations/` en orden. O con la CLI: `npx supabase link --project-ref <ref>` y `npx supabase db push`.
3. (Opcional) Ejecutar `supabase/seed.sql` para el curso de bienvenida, un evento y un borrador de blog.
4. **Authentication → URL Configuration:** Site URL `https://juandelagua.com` y Redirect URLs `https://juandelagua.com/auth/callback` (y `http://localhost:4321/auth/callback` para pruebas).
5. **Authentication → Providers → Email:** confirmar correo obligatorio, contraseña mínima de 8 caracteres y protección contra contraseñas filtradas (si el plan lo permite).
6. **Plantillas de correo** (Authentication → Emails → Templates): para que los enlaces funcionen en cualquier dispositivo y vuelvan a la página de origen (por ejemplo, un recurso), cambiar el link de cada plantilla por:
   - Confirm signup: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
   - Reset password: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery`
   - Magic link: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=magiclink`
   - Change email address: `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email_change`
7. **Correo (SMTP propio):** crear cuenta en Resend, verificar el dominio (registros SPF/DKIM en Cloudflare) y cargar el SMTP en Authentication → SMTP Settings, remitente `no-reply@juandelagua.com`.
8. **Google (opcional):** Authentication → Providers → Google con el Client ID/Secret de Google Cloud.
9. **Captcha (opcional):** Cloudflare Turnstile → clave secreta en Authentication → Attack Protection; clave pública en `PUBLIC_TURNSTILE_SITE_KEY`.
10. **Owner:** regístrate en `/registro`, confirma el correo y ejecuta `node --env-file=.env scripts/crear-owner.mjs tu-correo`.
11. **Tipos (opcional):** `npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts`.

### Comunidad en comunidad.juandelagua.com

El mismo contenedor atiende los dos dominios (`deploy/server.mjs`):

- `comunidad.juandelagua.com/` es la página de la comunidad; `/feed`, `/cursos`, `/recursos/skill`, etc. se sirven desde las rutas internas `/comunidad/*`.
- En `juandelagua.com`, cualquier `/comunidad/...` redirige al subdominio.
- Las cuentas (`/entrar`, `/registro`, `/cuenta`) funcionan en ambos y la sesión se comparte (cookies con dominio `.juandelagua.com`).
- En local (`npm run dev`) la comunidad sigue en `http://localhost:4321/comunidad`.

Para activarlo: en EasyPanel → tu app → **Domains**, agrega `comunidad.juandelagua.com` (puerto 4321, HTTPS), y en Cloudflare un registro `A` (o `CNAME`) `comunidad` hacia el VPS. En Supabase → Authentication → URL Configuration agrega también `https://comunidad.juandelagua.com/**` a las Redirect URLs.

### Recursos gratis (lead magnets de los reels)

"Comenta SKILL y te lo mando" → envías `comunidad.juandelagua.com/recursos/skill`.
La ficha es pública; para descargar hay que crear una cuenta y confirmar el correo (se valida en la base con `resource_access`).
Se gestionan en `/comunidad/admin/recursos` (archivo de hasta 50 MB en el bucket privado `recursos` o un link externo) y cada descarga queda registrada.

### Variables de entorno (EasyPanel → Environment)

| Variable | Para qué |
|---|---|
| `PUBLIC_SUPABASE_URL` | URL del proyecto (Settings → API) |
| `PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon/publishable) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta, **solo servidor**: borrar cuentas, firmar descargas de recursos, worker del blog |
| `SITE_URL` | `https://juandelagua.com` (enlaces de los correos) |
| `PUBLIC_TURNSTILE_SITE_KEY` | Opcional: captcha en registro y recuperación |
| `INDEXNOW_ENABLED` | Opcional (`true` por defecto) |
| `COMMUNITY_HOST` | Opcional (`comunidad.juandelagua.com` por defecto) |
| `AUTH_GOOGLE` | `true` para mostrar "Entrar con Google" (solo después de activar Google en Supabase) |

Se leen al arrancar el contenedor: cambiar una variable solo requiere reiniciar, no reconstruir.

### Pendiente para fases siguientes

- **Pagos de la comunidad (julio 2027):** la tabla `subscriptions` y el campo `membership` ya existen; falta elegir pasarela (Stripe, Mercado Pago o Flow), el webhook `/api/pagos/webhook` con verificación de firma y el bloqueo por membresía en el feed.
- **Resumen por correo** de notificaciones: las preferencias ya se guardan (`notification_prefs`); falta el envío (worker + Resend).
- Comentarios del blog conectados a la cuenta de la comunidad, chat privado entre miembros y apps móviles (fuera del alcance inicial).
- Alternativa: Supabase autoalojado en el VPS con EasyPanel (no implementado).

## SEO incluido

- URLs limpias sin `.html` ni barra final, con `canonical` en cada página.
- `sitemap-index.xml` automático (incluye `sitemap-blog.xml`, generado desde la base) y `robots.txt`.
- Title y meta description por página (≤ ~160 caracteres).
- Open Graph + Twitter Card con `og.jpg` (1200×630); los artículos usan su portada.
- Schema.org: `Person`, `ProfessionalService`, `Service` con `Offer`/`AggregateOffer` en CLP, `FAQPage`, `HowTo`, `BreadcrumbList`, `ProfilePage`, `ContactPage`, `Blog`, `BlogPosting`.
- Imágenes responsivas AVIF/WebP, fuentes self-hosted (sin Google Fonts), sin JS pesado.
- La comunidad y las cuentas son `noindex` y están fuera del sitemap.

## Subir a GitHub

```bash
git add .
git commit -m "Sitio juandelagua.com v1"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

Usa `gh auth login` o una llave SSH; **no pegues un token en la URL del remoto**.

## Desplegar en EasyPanel

1. En tu proyecto de EasyPanel: **+ Service → App**.
2. **Source:** GitHub → este repo, rama `main`.
3. **Build:** tipo **Dockerfile** (ruta `Dockerfile`).
4. **Environment:** las variables de `.env.example` (ver la sección de variables).
5. **Domains:** agrega `juandelagua.com` y `www.juandelagua.com`, puerto interno **4321**, HTTPS activado.
6. En tu DNS: registro `A` de `juandelagua.com` (y `www`) apuntando a la IP de tu VPS.
7. Activa **Auto Deploy** para que cada `git push` publique solo.

Para probar la imagen en tu PC (con Docker Desktop abierto):

```bash
docker build -t juandelagua-web .
docker run --rm -p 8080:4321 --env-file .env juandelagua-web   # http://localhost:8080
```

## Pendiente

- Analítica (Plausible en tu VPS o similar): agregar el script en `src/layouts/Base.astro`.
- Google Search Console: verificar el dominio y enviar `https://juandelagua.com/sitemap-index.xml`.
- Google Business Profile apuntando al sitio.
- Casos: agregar el primer caso en `src/content/casos/` cuando haya autorización escrita.
- Agenda del diagnóstico: en Google Calendar crear una "Agenda de citas" de 20 min y poner el link de la página de reservas en `SITE.bookingUrl` (se muestra en `/agendar`).
- Logo oficial (hoy el header usa el nombre en texto).
