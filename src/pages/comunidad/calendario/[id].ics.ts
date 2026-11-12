import type { APIRoute } from 'astro';
import { toIcs, type EventRow } from '../../../lib/events';
import { SITE_URL } from 'astro:env/server';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase!;
  const id = Number(params.id);
  const { data: e } = await supabase.from('events').select('id, title, description_md, starts_at, ends_at, tz, recurrence_rule, cover_url').eq('id', id).maybeSingle();
  if (!e) return new Response('No encontrado', { status: 404 });
  const { data: location } = await supabase.rpc('event_location', { p_event: id });
  return new Response(toIcs(e as EventRow, `${SITE_URL}/comunidad/calendario`, location), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="evento-${id}.ics"`, 'Cache-Control': 'private, no-store' },
  });
};
