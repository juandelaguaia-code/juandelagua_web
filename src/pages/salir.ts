// Cierra la sesión (POST desde el menú de la cuenta; GET también, por comodidad).
import type { APIRoute } from 'astro';
import { SESSION_HINT } from '../lib/supabase';

export const prerender = false;

const handler: APIRoute = async ({ locals, cookies, redirect }) => {
  if (locals.supabase) await locals.supabase.auth.signOut();
  cookies.delete(SESSION_HINT, { path: '/' });
  return redirect('/entrar?ok=salir');
};

export const GET = handler;
export const POST = handler;
