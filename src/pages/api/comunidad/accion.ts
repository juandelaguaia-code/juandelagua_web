/**
 * Acciones de la comunidad desde formularios (POST → redirect de vuelta).
 * La sesión del usuario va en las cookies: todas las escrituras pasan por RLS y por las funciones de la base.
 * Este archivo no decide permisos por su cuenta: si la base rechaza, se muestra "sin permiso".
 */
import type { APIRoute } from 'astro';
import { form, safeNext, withMsg, errorCode, rateLimit } from '../../../lib/http';
import { uploadImage } from '../../../lib/upload';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { locals, redirect } = ctx;
  const { supabase, user } = locals;
  if (!supabase || !user) return redirect('/entrar');
  const { fd, str, int, bool } = await form(ctx);
  const back = safeNext(str('back', 500), '/comunidad/feed');
  const action = str('action', 40);
  const go = (error: { message?: string; code?: string } | null, ok = 'guardado', to = back) =>
    redirect(error ? withMsg(to, 'error', errorCode(error)) : ok === '' ? to : withMsg(to, 'ok', ok));

  // Límite general contra abusos (por usuario)
  if (!rateLimit(`act:${user.id}`, 120, 10 * 60_000)) return redirect(withMsg(back, 'error', 'demasiados'));

  switch (action) {
    // ---------- publicaciones ----------
    case 'post.create': {
      if (!rateLimit(`post:${user.id}`, 10, 60 * 60_000)) return redirect(withMsg(back, 'error', 'demasiados'));
      const media: Record<string, string> = {};
      const link = str('link', 500);
      const video = str('video', 500);
      if (/^https:\/\//.test(link)) media.link = link;
      if (/^https:\/\//.test(video)) media.video = video;
      const up = await uploadImage(supabase, fd.get('image'), { bucket: 'media', folder: user.id, maxBytes: 5 * 1024 * 1024, allowGif: true });
      if (up && 'error' in up) return redirect(withMsg(back, 'error', 'archivo'));
      if (up) media.image = up.url;
      const options = str('poll', 1000).split('\n').map((o) => o.trim()).filter(Boolean).slice(0, 10);
      const { data, error } = await supabase.from('posts').insert({
        author_id: user.id, category_id: int('category_id'), title: str('title', 160), body_md: str('body_md', 20000),
        media, poll: options.length >= 2 ? { options } : null,
      }).select('id').single();
      return go(error, 'publicado', data ? `/comunidad/p/${data.id}` : back);
    }
    case 'post.edit': {
      const { error } = await supabase.from('posts').update({ title: str('title', 160), body_md: str('body_md', 20000), category_id: int('category_id') }).eq('id', int('id'));
      return go(error);
    }
    case 'post.delete': {
      const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', int('id'));
      return go(error, 'eliminado', '/comunidad/feed');
    }
    case 'post.pin':
    case 'post.lock': {
      const field = action === 'post.pin' ? 'pinned' : 'locked';
      const { error } = await supabase.from('posts').update({ [field]: bool('value') }).eq('id', int('id'));
      return go(error);
    }
    case 'post.move': {
      const { error } = await supabase.from('posts').update({ category_id: int('category_id') }).eq('id', int('id'));
      return go(error);
    }
    case 'poll.vote': {
      await supabase.from('poll_votes').delete().eq('post_id', int('id')).eq('user_id', user.id);
      const { error } = await supabase.from('poll_votes').insert({ post_id: int('id'), user_id: user.id, option_index: int('option') });
      return go(error, '');
    }

    // ---------- comentarios ----------
    case 'comment.create': {
      if (!rateLimit(`comment:${user.id}`, 40, 60 * 60_000)) return redirect(withMsg(back, 'error', 'demasiados'));
      const parent = int('parent_id');
      const { data, error } = await supabase.from('comments').insert({
        post_id: int('post_id'), author_id: user.id, parent_id: Number.isInteger(parent) ? parent : null, body_md: str('body_md', 5000),
      }).select('id').single();
      return go(error, '', data ? `${back.split('#')[0]}#c${data.id}` : back);
    }
    case 'comment.edit': {
      const { error } = await supabase.from('comments').update({ body_md: str('body_md', 5000) }).eq('id', int('id'));
      return go(error);
    }
    case 'comment.delete': {
      const { error } = await supabase.from('comments').update({ deleted_at: new Date().toISOString() }).eq('id', int('id'));
      return go(error, 'eliminado');
    }

    // ---------- me gusta ----------
    case 'like':
    case 'unlike': {
      const type = str('type') === 'comment' ? 'comment' : 'post';
      const { error } = action === 'like'
        ? await supabase.from('likes').insert({ user_id: user.id, target_type: type, target_id: int('id') })
        : await supabase.from('likes').delete().eq('user_id', user.id).eq('target_type', type).eq('target_id', int('id'));
      // Ya tenía me gusta: no es error
      return go(error?.code === '23505' ? null : error, '');
    }

    // ---------- reportes ----------
    case 'report': {
      const type = ['post', 'comment', 'profile'].includes(str('type')) ? str('type') : 'post';
      const { error } = await supabase.from('reports').insert({ reporter_id: user.id, target_type: type, target_id: str('id', 60), reason: str('reason', 1000) || 'Sin detalle' });
      return go(error, 'reportado');
    }

    // ---------- cursos y eventos ----------
    case 'lesson.complete':
    case 'lesson.uncomplete': {
      const { error } = action === 'lesson.complete'
        ? await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: int('id') })
        : await supabase.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', int('id'));
      return go(error, '');
    }
    case 'rsvp': {
      const status = ['going', 'maybe', 'no'].includes(str('status')) ? str('status') : 'going';
      const { error } = await supabase.from('event_rsvps').upsert({ event_id: int('id'), user_id: user.id, status });
      return go(error, '');
    }

    // ---------- notificaciones ----------
    case 'notifications.read': {
      const id = int('id');
      let q = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
      if (Number.isInteger(id)) q = q.eq('id', id);
      const { error } = await q;
      return go(error, '');
    }
  }
  return redirect(back);
};
