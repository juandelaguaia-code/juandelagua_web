# juandelagua.com

Sitio de **Juan del Agua**: consultor de IA y marketing digital para pymes y empresas en Chile.
Astro: páginas estáticas + un endpoint Node (`/api/diagnostico`) para el agente de diagnóstico con IA. Docker, pensado para EasyPanel.

## Trabajar en local

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/
npm run preview    # sirve el build
```

Para probar el agente con IA en local, copia `.env.example` como `.env` y pon tu `ANTHROPIC_API_KEY`.
Sin clave, el diagnóstico funciona igual con un informe por reglas.

## Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| WhatsApp, redes, textos base, menú, método (consultoría IA), certificaciones | `src/data/site.ts` |
| Preguntas frecuentes del inicio | `src/data/faq.ts` |
| Colores, tipografía, botones, tarjetas | `src/styles/global.css` |
| Cada página | `src/pages/*.astro` (la ruta = el nombre del archivo) |
| SEO global, schema (JSON-LD), Open Graph | `src/layouts/Base.astro` |
| Fotos | `src/assets/img/` (Astro las optimiza a AVIF/WebP) |
| Agente de diagnóstico: preguntas y pantalla | `src/components/DiagnosticoAgente.astro` |
| Agente: prompt, esquema del informe, informe de respaldo | `src/lib/diagnostico.ts` |
| Agente: endpoint (modelo, límite por IP, webhook de leads) | `src/pages/api/diagnostico.ts` |
| Animaciones de agua ligadas al scroll | `src/scripts/fx.ts`, `src/components/Wave.astro`, `src/components/WaterCanvas.astro` |
| Imagen para compartir (OG) y favicon | `public/og.jpg`, `public/favicon.svg` → regenerar con `node scripts/make-images.mjs` |

## Páginas

`/` · `/consultoria-ia` (incluye el método) · `/marketing-digital` · `/diagnostico` · `/claude-for-small-business` · `/sobre-mi` · `/contacto` · `/privacidad` · `404`

## SEO incluido

- URLs limpias sin `.html` ni barra final, con `canonical` en cada página.
- `sitemap-index.xml` automático y `robots.txt`.
- Title y meta description por página (≤ ~160 caracteres).
- Open Graph + Twitter Card con `og.jpg` (1200×630).
- Schema.org: `Person`, `ProfessionalService`, `Service`, `FAQPage`, `HowTo`, `BreadcrumbList`, `ProfilePage`, `ContactPage`.
- Imágenes responsivas AVIF/WebP, fuentes self-hosted (sin Google Fonts), sin JS pesado.

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
4. **Environment:** `ANTHROPIC_API_KEY=...` (y opcional `LEAD_WEBHOOK_URL=...` para recibir los leads en n8n/CRM).
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
- Casos: agregar la sección cuando haya un caso con permiso y métricas.
- Leads del diagnóstico: conectar `LEAD_WEBHOOK_URL` a n8n/Supabase para guardarlos.
- Logo oficial (hoy el header usa el nombre en texto).
