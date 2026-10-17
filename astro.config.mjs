// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://juandelagua.com',
  // URLs limpias sin barra final: /consultoria-ia sirve consultoria-ia.html
  trailingSlash: 'never',
  build: { format: 'file' },
  // Las páginas se pre-generan (estáticas). Solo /api/* corre en el servidor Node (agente de diagnóstico).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/api/'),
      i18n: { defaultLocale: 'es', locales: { es: 'es-CL' } },
    }),
  ],
});
