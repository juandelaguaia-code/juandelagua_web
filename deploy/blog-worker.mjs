/**
 * Tareas programadas del blog (corre en segundo plano en el contenedor, ver Dockerfile).
 *
 * Cada 5 minutos busca artículos que ya están en línea (publicados, o programados cuya hora llegó)
 * y que aún no se han avisado a IndexNow; los avisa y los marca. Así un artículo programado para
 * el lunes a las 09:00 aparece solo, entra al sitemap (que se genera al vuelo) y llega a Bing.
 *
 * Necesita PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Si faltan, no hace nada.
 * Si algo falla, solo lo registra en el log: nunca detiene la web.
 */
const SITE = process.env.SITE_URL || 'https://juandelagua.com';
const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const INDEXNOW_KEY = 'be00d94565cbd280f46f4fb32256b237';
const EVERY_MS = 5 * 60 * 1000;

const log = (msg) => console.log(`[blog-worker] ${msg}`);

async function rest(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

async function tick() {
  const now = new Date().toISOString();
  const posts = await rest(
    `blog_posts?select=id,slug,series,blog_categories(slug)&status=in.(published,scheduled)&published_at=lte.${encodeURIComponent(now)}&indexnow_notified_at=is.null&limit=50`,
  );
  if (!posts.length) return;
  const urls = new Set([`${SITE}/blog`, `${SITE}/sitemap-blog.xml`]);
  for (const p of posts) {
    urls.add(`${SITE}/blog/${p.slug}`);
    if (p.blog_categories?.slug) urls.add(`${SITE}/blog/categoria/${p.blog_categories.slug}`);
    if (p.series) urls.add(`${SITE}/blog/serie/${p.series}`);
  }
  if (process.env.INDEXNOW_ENABLED !== 'false') {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: new URL(SITE).host, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: [...urls] }),
    });
    log(`${posts.length} artículo(s), ${urls.size} URLs → IndexNow HTTP ${res.status}`);
    if (!res.ok && res.status !== 202) return;
  }
  await rest(`blog_posts?id=in.(${posts.map((p) => p.id).join(',')})`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ indexnow_notified_at: new Date().toISOString() }),
  });
}

if (!SUPABASE_URL || !KEY) {
  log('sin PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY; no se ejecuta');
} else {
  const run = () => tick().catch((e) => log(`error: ${e instanceof Error ? e.message : e}`));
  setTimeout(run, 60 * 1000);
  setInterval(run, EVERY_MS);
}
