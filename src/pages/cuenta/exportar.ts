// Descarga de mis datos (Ley 21.719: acceso y portabilidad). Usa la sesión del usuario: RLS limita a lo propio.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals, redirect }) => {
  const { supabase, user } = locals;
  if (!supabase || !user) return redirect('/entrar?next=/cuenta');
  const q = async (table: string, column = 'user_id') => (await supabase.from(table).select('*').eq(column, user.id)).data ?? [];
  const data = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    profile: (await supabase.from('profiles').select('*').eq('id', user.id).single()).data,
    consents: await q('consents'),
    join_requests: await q('join_requests'),
    posts: await q('posts', 'author_id'),
    comments: await q('comments', 'author_id'),
    likes: await q('likes'),
    poll_votes: await q('poll_votes'),
    points: await q('points_ledger'),
    lesson_progress: await q('lesson_progress'),
    event_rsvps: await q('event_rsvps'),
    notifications: await q('notifications'),
    notification_prefs: await q('notification_prefs'),
    subscriptions: await q('subscriptions'),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="mis-datos-juandelagua-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
