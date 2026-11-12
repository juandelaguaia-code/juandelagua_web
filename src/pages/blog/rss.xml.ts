import type { APIRoute } from 'astro';
import { listPosts, BLOG_CACHE } from '../../lib/blog';
import { SITE } from '../../data/site';

export const prerender = false;

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async () => {
  const { posts } = await listPosts({ limit: 30 });
  const items = posts.map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${SITE.url}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE.url}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.published_at!).toUTCString()}</pubDate>
      ${p.blog_categories ? `<category>${esc(p.blog_categories.name)}</category>` : ''}
      <description>${esc(p.excerpt || '')}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog de Juan del Agua</title>
    <link>${SITE.url}/blog</link>
    <atom:link href="${SITE.url}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>IA para pymes, automatización y agentes, marketing y campañas, y el proceso real de crear una marca.</description>
    <language>es-CL</language>${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': BLOG_CACHE } });
};
