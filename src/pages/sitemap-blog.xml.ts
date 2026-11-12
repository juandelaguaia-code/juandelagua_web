// Sitemap dinámico del blog (el de @astrojs/sitemap solo conoce las rutas estáticas).
// Está referenciado en sitemap-index.xml (customSitemaps en astro.config.mjs) y en robots.txt.
import type { APIRoute } from 'astro';
import { allLiveForSitemap, listCategories, BLOG_CACHE } from '../lib/blog';
import { SITE } from '../data/site';

export const prerender = false;

export const GET: APIRoute = async () => {
  const [posts, categories] = await Promise.all([allLiveForSitemap(), listCategories()]);
  const latest = posts[0]?.updated_at;
  const urls = [
    { loc: `${SITE.url}/blog`, lastmod: latest },
    ...categories.map((c) => ({ loc: `${SITE.url}/blog/categoria/${c.slug}`, lastmod: posts.find((p) => p.blog_categories?.slug === c.slug)?.updated_at })),
    ...[...new Set(posts.map((p) => p.series).filter(Boolean))].map((s) => ({ loc: `${SITE.url}/blog/serie/${s}`, lastmod: posts.find((p) => p.series === s)?.updated_at })),
    ...posts.map((p) => ({ loc: `${SITE.url}/blog/${p.slug}`, lastmod: p.updated_at })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': BLOG_CACHE } });
};
