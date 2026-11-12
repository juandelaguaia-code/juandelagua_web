/**
 * Sesión y protección de rutas.
 * - Lee la sesión de Supabase desde cookies httpOnly (@supabase/ssr) → Astro.locals.user / Astro.locals.profile.
 * - /comunidad/* (salvo /comunidad, que es estática), /cuenta y /admin/* requieren sesión.
 * - Las páginas pre-generadas (marketing) no pasan por aquí en producción.
 * Los permisos reales se validan además en la base de datos (RLS): esto solo evita mostrar páginas vacías.
 */
import { defineMiddleware } from 'astro:middleware';
import { createSupabase, supabaseConfigured, hasAuthCookie, SESSION_HINT } from './lib/supabase';
import { PROFILE_COLUMNS, canRead, hasRole, type Profile } from './lib/types';
import { SITE } from './data/site';

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${SITE.plausibleUrl} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' ${SITE.plausibleUrl} https://*.supabase.co`,
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://www.loom.com https://challenges.cloudflare.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.supabase.co https://accounts.google.com",
  "object-src 'none'",
].join('; ');

const needsLogin = (p: string) => p.startsWith('/comunidad/') || p === '/cuenta' || p.startsWith('/cuenta/') || p === '/admin' || p.startsWith('/admin/');

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();

  ctx.locals.supabase = null;
  ctx.locals.user = null;
  ctx.locals.profile = null;
  const path = ctx.url.pathname.replace(/\/$/, '') || '/';

  if (supabaseConfigured()) {
    const supabase = createSupabase(ctx);
    ctx.locals.supabase = supabase;
    // El blog es público y se cachea en Cloudflare: no lee la sesión (así nunca se cachea algo personal)
    const publicCached = path.startsWith('/blog') || path.startsWith('/sitemap-blog');
    if (!publicCached && hasAuthCookie(ctx.request)) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        ctx.locals.user = data.user;
        const { data: profile } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', data.user.id).single<Profile>();
        ctx.locals.profile = profile ?? null;
        // "En línea": se actualiza como máximo cada 5 minutos
        if (profile && (!profile.last_seen_at || Date.now() - +new Date(profile.last_seen_at) > 5 * 60_000)) {
          void supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', profile.id).then(() => {});
        }
      }
    }
  }

  // Cookie de pista (sin datos) para que las páginas estáticas muestren "Mi cuenta"
  const hinted = ctx.cookies.has(SESSION_HINT);
  if (ctx.locals.user && !hinted) ctx.cookies.set(SESSION_HINT, '1', { path: '/', sameSite: 'lax', secure: import.meta.env.PROD, maxAge: 60 * 60 * 24 * 30 });
  else if (!ctx.locals.user && hinted && !path.startsWith('/blog') && !path.startsWith('/sitemap-blog')) ctx.cookies.delete(SESSION_HINT, { path: '/' });

  if (needsLogin(path)) {
    const { user, profile } = ctx.locals;
    if (!user) return ctx.redirect(`/entrar?next=${encodeURIComponent(ctx.url.pathname + ctx.url.search)}`);
    if (profile?.status === 'banned' && path !== '/cuenta') return ctx.redirect('/cuenta?aviso=expulsado');
    const communityPrivate = path.startsWith('/comunidad/') && path !== '/comunidad/ingreso';
    if (communityPrivate && !canRead(profile)) return ctx.redirect('/comunidad/ingreso');
    if (path.startsWith('/comunidad/admin') && !hasRole(profile, 'moderator')) return ctx.redirect('/comunidad/feed');
    if ((path === '/admin' || path.startsWith('/admin/')) && !hasRole(profile, 'admin')) return ctx.redirect('/');
  }

  const response = await next();
  const h = response.headers;
  h.set('Content-Security-Policy', CSP);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (ctx.locals.user && !h.has('Cache-Control')) h.set('Cache-Control', 'private, no-store');
  return response;
});
