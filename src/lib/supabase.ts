/**
 * Clientes de Supabase para el servidor.
 * - `createSupabase(context)`: cliente con la sesión del usuario (cookies httpOnly). Respeta RLS.
 * - `adminClient()`: service_role, SOLO para tareas de servidor que no puede hacer el usuario
 *   (borrar su cuenta, firmar descargas, tareas programadas). Nunca se expone al navegador.
 */
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from 'astro:env/server';

export const supabaseConfigured = () => Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);

/** Cookie NO httpOnly que solo indica "hay sesión" para que las páginas estáticas muestren "Mi cuenta". No contiene datos. */
export const SESSION_HINT = 'jda_s';

export function createSupabase(ctx: { request: Request; cookies: AstroCookies }): SupabaseClient {
  if (!supabaseConfigured()) throw new Error('Supabase no está configurado (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY)');
  return createServerClient(PUBLIC_SUPABASE_URL!, PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return parseCookieHeader(ctx.request.headers.get('cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' }));
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          ctx.cookies.set(name, value, { ...options, path: '/', httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax' });
        }
      },
    },
    auth: { flowType: 'pkce' },
  });
}

let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  _admin ??= createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return _admin;
}

export const hasAuthCookie = (request: Request) => /(?:^|;\s*)sb-[^=]+-auth-token/.test(request.headers.get('cookie') ?? '');
