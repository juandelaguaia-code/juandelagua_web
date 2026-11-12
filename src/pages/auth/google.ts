// Inicia sesión con Google (requiere habilitar el proveedor Google en Supabase Auth).
import type { APIRoute } from 'astro';
import { safeNext, withMsg } from '../../lib/http';
import { SITE_URL } from 'astro:env/server';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  if (!locals.supabase) return redirect(withMsg('/entrar', 'error', 'no_configurado'));
  const next = safeNext(url.searchParams.get('next'));
  const { data, error } = await locals.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return redirect(withMsg('/entrar', 'error', 'desconocido'));
  return redirect(data.url);
};
