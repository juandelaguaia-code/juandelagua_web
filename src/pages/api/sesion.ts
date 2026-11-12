// Datos mínimos de la sesión para el header de las páginas estáticas. Nunca se cachea.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' };
  const { profile, supabase } = locals;
  if (!profile || !supabase) return new Response(JSON.stringify({ user: null }), { headers });
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
  return new Response(
    JSON.stringify({ user: { username: profile.username, avatar_url: profile.avatar_url, status: profile.status, role: profile.role }, unread: count ?? 0 }),
    { headers },
  );
};
