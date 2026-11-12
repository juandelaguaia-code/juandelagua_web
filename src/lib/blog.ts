/**
 * Consultas públicas del blog. Usa un cliente anónimo SIN cookies: lo que se muestra (y se cachea en
 * Cloudflare) es siempre lo que ve cualquier visitante, aunque quien mire sea admin.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from 'astro:env/server';

export interface BlogCategory { id: number; slug: string; name: string; description: string; cta: 'diagnostico' | 'comunidad' }
export interface BlogPost {
  id: number; slug: string; title: string; excerpt: string; body_md: string; cover_url: string | null; cover_alt: string | null;
  category_id: number | null; tags: string[]; series: string | null; author_id: string | null; status: 'draft' | 'scheduled' | 'published';
  published_at: string | null; updated_at: string; seo_title: string | null; seo_description: string | null; canonical_url: string | null;
  reading_minutes: number; blog_categories?: BlogCategory | null;
}

export const SERIES: Record<string, string> = {
  'claude-en-1-minuto': 'Claude en 1 minuto',
  'marketing-en-1-minuto': 'Marketing en 1 minuto',
  'creando-mi-marca': 'Creando mi marca',
};
export const seriesName = (s: string) => SERIES[s] ?? s.replace(/-/g, ' ');

const LIST_COLUMNS = 'id, slug, title, excerpt, cover_url, cover_alt, category_id, tags, series, published_at, updated_at, reading_minutes, status, blog_categories(id, slug, name, description, cta)';

let _anon: SupabaseClient | null = null;
export const blogConfigured = () => Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
export function publicClient() {
  if (!blogConfigured()) return null;
  _anon ??= createClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  return _anon;
}

// La RLS ya filtra lo no publicado; además se filtra aquí por claridad
const live = <T extends { lte: Function; in: Function }>(q: T) =>
  (q as any).in('status', ['published', 'scheduled']).lte('published_at', new Date().toISOString()) as T;

export const PAGE_SIZE = 12;

export async function listPosts(opts: { page?: number; categoryId?: number; series?: string; limit?: number } = {}) {
  const db = publicClient();
  if (!db) return { posts: [] as BlogPost[], total: 0 };
  const limit = opts.limit ?? PAGE_SIZE;
  const from = ((opts.page ?? 1) - 1) * limit;
  let q = db.from('blog_posts').select(LIST_COLUMNS, { count: 'exact' });
  q = live(q);
  if (opts.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts.series) q = q.eq('series', opts.series);
  const { data, count } = await q.order('published_at', { ascending: false }).range(from, from + limit - 1);
  return { posts: (data ?? []) as unknown as BlogPost[], total: count ?? 0 };
}

export async function getPost(slug: string) {
  const db = publicClient();
  if (!db) return null;
  const { data } = await live(db.from('blog_posts').select('*, blog_categories(id, slug, name, description, cta)').eq('slug', slug)).maybeSingle();
  return (data as BlogPost | null) ?? null;
}

export async function relatedPosts(post: BlogPost, limit = 3) {
  const db = publicClient();
  if (!db) return [];
  let q = live(db.from('blog_posts').select(LIST_COLUMNS).neq('id', post.id));
  if (post.series) q = q.or(`series.eq.${post.series},category_id.eq.${post.category_id ?? 0}`);
  else if (post.category_id) q = q.eq('category_id', post.category_id);
  const { data } = await q.order('published_at', { ascending: false }).limit(limit);
  return (data ?? []) as unknown as BlogPost[];
}

export async function listCategories() {
  const db = publicClient();
  if (!db) return [] as BlogCategory[];
  const { data } = await db.from('blog_categories').select('*').order('id');
  return (data ?? []) as BlogCategory[];
}

export async function allLiveForSitemap() {
  const db = publicClient();
  if (!db) return [];
  const { data } = await live(db.from('blog_posts').select('slug, updated_at, published_at, series, category_id, blog_categories(slug)'))
    .order('published_at', { ascending: false }).limit(5000);
  return (data ?? []) as unknown as { slug: string; updated_at: string; published_at: string; series: string | null; blog_categories: { slug: string } | null }[];
}

export const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santiago' }).format(new Date(iso)) : '';

/** Cabeceras de caché para Cloudflare: corta, con revalidación en segundo plano */
export const BLOG_CACHE = 'public, max-age=60, s-maxage=300, stale-while-revalidate=600';
