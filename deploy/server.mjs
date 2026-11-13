/**
 * Servidor de producción: el mismo contenedor atiende dos dominios.
 *
 *   juandelagua.com            → sitio principal (y /comunidad/* redirige al subdominio)
 *   comunidad.juandelagua.com  → la comunidad: "/feed" se sirve desde las rutas internas "/comunidad/feed"
 *
 * Las cuentas (/entrar, /registro, /cuenta, /auth/*) y la API funcionan en ambos dominios y la sesión
 * se comparte (cookies con dominio .juandelagua.com, ver src/lib/supabase.ts).
 * Cualquier otra página del sitio principal pedida en el subdominio redirige al dominio principal.
 */
process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('../dist/server/entry.mjs');
import http from 'node:http';
import fs from 'node:fs';

const PORT = Number(process.env.PORT ?? 4321);
const HOST = process.env.HOST ?? '0.0.0.0';
const SITE = (process.env.SITE_URL ?? 'https://juandelagua.com').replace(/\/$/, '');
const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? 'comunidad.juandelagua.com';
const MAIN_HOSTS = new Set([new URL(SITE).host, `www.${new URL(SITE).host}`]);

// Rutas que funcionan igual en los dos dominios
const SHARED = [/^\/_astro\//, /^\/api\//, /^\/auth\//, /^\/(entrar|registro|recuperar|restablecer|salir)$/, /^\/cuenta(\/|$)/,
  /^\/(favicon\.svg|apple-touch-icon\.png|og\.jpg|robots\.txt|[0-9a-f]{32}\.txt)$/];
// Secciones propias de la comunidad (en el subdominio van sin el prefijo /comunidad)
const COMMUNITY = /^\/($|ingreso|feed|p\/|cursos|calendario|miembros|ranking|u\/|notificaciones|admin|recursos)/;

// Con build.format 'file', una página con subpáginas (p. ej. /ofertas y /ofertas/webs) genera ofertas.html
// y la carpeta ofertas/. El servidor estático de Astro ve la carpeta y responde 404: aquí se sirve el .html.
const CLIENT = new URL('../dist/client/', import.meta.url);
const pageWithFolder = (path) => {
  if (!/^\/[a-z0-9/_-]+$/i.test(path)) return false;
  try { return fs.statSync(new URL(`.${path}`, CLIENT)).isDirectory() && fs.existsSync(new URL(`.${path}.html`, CLIENT)); }
  catch { return false; }
};

const redirect = (res, location, status = 301) => { res.writeHead(status, { Location: location, 'Cache-Control': 'no-cache' }); res.end(); };

const server = http.createServer((req, res) => {
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '').split(',')[0].trim().split(':')[0].toLowerCase();
  const url = new URL(req.url ?? '/', 'http://x');
  const path = url.pathname;

  if (host === COMMUNITY_HOST) {
    // Links antiguos con prefijo: /comunidad/feed → /feed
    if (path === '/comunidad' || path.startsWith('/comunidad/')) return redirect(res, (path.slice('/comunidad'.length) || '/') + url.search);
    if (!SHARED.some((r) => r.test(path))) {
      if (!COMMUNITY.test(path)) return redirect(res, SITE + path + url.search);
      req.url = (path === '/' ? '/comunidad' : `/comunidad${path}`) + url.search;
    }
    req.headers['x-jda-community'] = '1';
  } else if (MAIN_HOSTS.has(host) && (path === '/comunidad' || path.startsWith('/comunidad/'))) {
    return redirect(res, `https://${COMMUNITY_HOST}${path.slice('/comunidad'.length) || '/'}${url.search}`);
  } else {
    delete req.headers['x-jda-community'];
    if (pageWithFolder(path)) req.url = `${path}.html${url.search}`;
  }
  handler(req, res);
});

server.listen(PORT, HOST, () => console.log(`[server] escuchando en http://${HOST}:${PORT} (comunidad: ${COMMUNITY_HOST})`));
