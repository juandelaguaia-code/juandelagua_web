/**
 * Aviso a IndexNow (Bing y otros) cuando se publica o actualiza un artículo.
 * Misma clave que deploy/indexnow.mjs: el archivo public/<32 hex>.txt.
 */
import { INDEXNOW_ENABLED, SITE_URL } from 'astro:env/server';

const KEY = 'be00d94565cbd280f46f4fb32256b237';

export async function pingIndexNow(paths: string[]) {
  if (!INDEXNOW_ENABLED || !import.meta.env.PROD || !paths.length) return false;
  const host = new URL(SITE_URL).host;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList: paths.map((p) => new URL(p, SITE_URL).href) }),
    });
    console.log(`[indexnow] ${paths.length} URLs → HTTP ${res.status}`);
    return res.ok;
  } catch (e) {
    console.log(`[indexnow] error: ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

export const blogPaths = (slug: string, categorySlug?: string | null, series?: string | null) =>
  ['/blog', `/blog/${slug}`, ...(categorySlug ? [`/blog/categoria/${categorySlug}`] : []), ...(series ? [`/blog/serie/${series}`] : [])];
