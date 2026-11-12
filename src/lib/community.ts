// Utilidades de la comunidad
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Author { id: string; username: string; full_name: string; avatar_url: string | null; level: number; role?: string }
export const AUTHOR_COLUMNS = 'id, username, full_name, avatar_url, level, role';

export const displayName = (a: Author | null | undefined) => (a ? a.full_name || a.username : 'Miembro eliminado');

const rtf = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' });
export function timeAgo(iso: string) {
  const s = (Date.now() - +new Date(iso)) / 1000;
  if (s < 60) return 'recién';
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), 'day');
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Santiago' }).format(new Date(iso));
}

export const isOnline = (lastSeen: string | null) => !!lastSeen && Date.now() - +new Date(lastSeen) < 10 * 60_000;

export async function levelNames(supabase: SupabaseClient) {
  const { data } = await supabase.from('levels').select('level, name, min_points').order('level');
  return (data ?? []) as { level: number; name: string; min_points: number }[];
}

/** Mapa de perfiles por id (para mostrar autores) */
export async function authorsById(supabase: SupabaseClient, ids: (string | null)[]) {
  const unique = [...new Set(ids.filter(Boolean))] as string[];
  if (!unique.length) return new Map<string, Author>();
  const { data } = await supabase.from('profiles').select(AUTHOR_COLUMNS).in('id', unique);
  return new Map((data ?? []).map((a: Author) => [a.id, a]));
}

/** Ids que el usuario actual ya marcó con me gusta */
export async function myLikes(supabase: SupabaseClient, userId: string, type: 'post' | 'comment', ids: number[]) {
  if (!ids.length) return new Set<number>();
  const { data } = await supabase.from('likes').select('target_id').eq('user_id', userId).eq('target_type', type).in('target_id', ids);
  return new Set((data ?? []).map((l: { target_id: number }) => l.target_id));
}

export const NOTIFICATION_TEXT: Record<string, (p: any) => string> = {
  reply: (p) => `respondió tu comentario en "${p.post_title ?? 'una publicación'}"`,
  comment: (p) => `comentó tu publicación "${p.post_title ?? ''}"`,
  mention: (p) => `te mencionó en "${p.post_title ?? 'una publicación'}"`,
  like: (p) => `le dio me gusta a tu ${p.target_type === 'comment' ? 'comentario' : 'publicación'} "${p.post_title ?? ''}"`,
  event: (p) => `Nuevo evento: ${p.title}`,
  approved: () => '¡Tu solicitud fue aprobada! Ya eres parte de la comunidad.',
  system: (p) => p.text ?? 'Aviso de la comunidad',
};

export const notificationLink = (type: string, p: any) =>
  p.post_id ? `/comunidad/p/${p.post_id}${p.comment_id ? `#c${p.comment_id}` : ''}` : type === 'event' ? '/comunidad/calendario' : '/comunidad/feed';
