/**
 * Vuelta desde los correos de Supabase Auth (confirmación, enlace mágico, recuperación, cambio de correo) y desde Google.
 * Acepta los dos formatos:
 *  - ?code=...                          (PKCE: mismo navegador donde se pidió)
 *  - ?token_hash=...&type=signup|magiclink|recovery|email_change|email
 *                                       (recomendado en las plantillas de correo: funciona en cualquier dispositivo)
 */
import type { APIRoute } from 'astro';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext, withMsg } from '../../lib/http';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const supabase = locals.supabase;
  if (!supabase) return redirect(withMsg('/entrar', 'error', 'no_configurado'));
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const next = safeNext(url.searchParams.get('next'), type === 'recovery' ? '/restablecer' : '/comunidad/feed?bienvenida=1');
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');

  let error: unknown = null;
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  else error = new Error('sin código');

  if (error) return redirect(withMsg(type === 'recovery' ? '/recuperar' : '/entrar', 'error', 'enlace'));
  return redirect(type === 'recovery' ? '/restablecer' : next);
};
