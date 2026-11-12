// Últimos artículos para el inicio (página estática que los carga al abrirse)
import type { APIRoute } from 'astro';
import { listPosts, formatDate, BLOG_CACHE } from '../../../lib/blog';

export const prerender = false;

export const GET: APIRoute = async () => {
  const { posts } = await listPosts({ limit: 3 });
  const body = posts.map((p) => ({
    slug: p.slug, title: p.title, excerpt: p.excerpt, cover_url: p.cover_url, cover_alt: p.cover_alt,
    category: p.blog_categories?.name ?? '', date: formatDate(p.published_at), minutes: p.reading_minutes,
  }));
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': BLOG_CACHE } });
};
