// @ts-check
import { defineConfig, envField } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// Rutas que corren en el servidor (no se incluyen en el sitemap estático; el blog tiene su propio sitemap)
const PRIVATE = ['/404', '/api/', '/comunidad/', '/admin', '/cuenta', '/entrar', '/registro', '/recuperar', '/restablecer', '/salir', '/auth/', '/blog'];

// https://astro.build/config
export default defineConfig({
  site: 'https://juandelagua.com',
  // URLs limpias sin barra final: /consultor-ia sirve consultor-ia.html
  trailingSlash: 'never',
  build: { format: 'file' },
  // Las páginas de marketing se pre-generan (estáticas). Blog, comunidad, cuentas y /api/*
  // corren en el servidor Node: cada una declara `export const prerender = false`.
  output: 'static',
  // deploy/server.mjs arranca este servidor y agrega el subdominio de la comunidad. Límite de subida: 60 MB.
  adapter: node({ mode: 'standalone', bodySizeLimit: 60 * 1024 * 1024 }),
  security: {
    // Protección CSRF: rechaza formularios POST de otro origen
    checkOrigin: true,
    // Detrás del proxy de EasyPanel (HTTPS termina en el proxy): confiar en X-Forwarded-Host/Proto solo para estos dominios
    allowedDomains: [
      { hostname: 'juandelagua.com', protocol: 'https' },
      { hostname: 'www.juandelagua.com', protocol: 'https' },
      { hostname: 'comunidad.juandelagua.com', protocol: 'https' },
    ],
  },
  // Variables de entorno leídas en tiempo de ejecución (EasyPanel → Environment). Ver .env.example.
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      SITE_URL: envField.string({ context: 'server', access: 'public', default: 'https://juandelagua.com' }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
      // Muestra "Entrar con Google" solo cuando el proveedor Google está activo en Supabase
      AUTH_GOOGLE: envField.boolean({ context: 'server', access: 'public', default: false }),
      INDEXNOW_ENABLED: envField.boolean({ context: 'server', access: 'public', default: true }),
    },
  },
  integrations: [
    sitemap({
      // El sitemap del blog se genera en el servidor desde la base de datos
      customSitemaps: ['https://juandelagua.com/sitemap-blog.xml'],
      filter: (page) => !PRIVATE.some((p) => new URL(page).pathname.startsWith(p)),
      i18n: { defaultLocale: 'es', locales: { es: 'es-CL' } },
    }),
  ],
});
