/**
 * Acciones de administración de la comunidad. Todas usan la sesión del usuario:
 * la base de datos valida el rol (RLS y funciones set_member_role, set_member_status, etc.) y registra en audit_log.
 */
import type { APIRoute } from 'astro';
import { form, safeNext, withMsg, errorCode } from '../../../lib/http';
import { uploadImage } from '../../../lib/upload';
import { chileLocalToIso, slugify } from '../../../lib/time';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const { supabase, user } = ctx.locals;
  if (!supabase || !user) return ctx.redirect('/entrar');
  const { fd, str, int, bool } = await form(ctx);
  const back = safeNext(str('back', 500), '/comunidad/admin');
  const done = (error: { message?: string; code?: string } | null, to = back) =>
    ctx.redirect(withMsg(to, error ? 'error' : 'ok', error ? errorCode(error) : 'guardado'));

  switch (str('action', 40)) {
    // ---------- ajustes ----------
    case 'settings': {
      const questions = str('join_questions', 3000).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 8).map((l, i) => {
        const required = l.endsWith('*');
        return { id: `q${i + 1}`, label: l.replace(/\*$/, '').trim().slice(0, 200), required };
      });
      const { error } = await supabase.from('community_settings').update({
        name: str('name', 80), tagline: str('tagline', 200), approval_mode: str('approval_mode') === 'auto' ? 'auto' : 'manual',
        rules_md: str('rules_md', 5000), join_questions: questions, welcome_course_slug: str('welcome_course_slug', 80) || null, updated_at: new Date().toISOString(),
      }).eq('id', 1);
      return done(error);
    }
    case 'levels': {
      for (let l = 1; l <= 9; l++) {
        const { error } = await supabase.from('levels').update({ name: str(`name_${l}`, 40), min_points: l === 1 ? 0 : Math.max(0, int(`min_${l}`) || 0) }).eq('level', l);
        if (error) return done(error);
      }
      return done(null);
    }
    case 'category.save': {
      const values = { slug: slugify(str('slug', 40) || str('name', 60)).slice(0, 40), name: str('name', 60), emoji: str('emoji', 8), position: int('position') || 0, admins_only_post: bool('admins_only_post') };
      const id = int('id');
      const { error } = Number.isInteger(id) ? await supabase.from('categories').update(values).eq('id', id) : await supabase.from('categories').insert(values);
      return done(error);
    }
    case 'category.delete': {
      const { error } = await supabase.from('categories').delete().eq('id', int('id'));
      return done(error);
    }

    // ---------- miembros ----------
    case 'join.review': {
      const { error } = await supabase.rpc('review_join_request', { p_request: int('id'), approve: str('decision') === 'approve' });
      return done(error);
    }
    case 'member.role': {
      const { error } = await supabase.rpc('set_member_role', { target: str('id', 40), new_role: str('role', 20) });
      return done(error);
    }
    case 'member.status': {
      const until = str('until', 20) ? chileLocalToIso(str('until', 20)) : null;
      const { error } = await supabase.rpc('set_member_status', { target: str('id', 40), new_status: str('status', 20), until });
      return done(error);
    }
    case 'member.membership': {
      const { error } = await supabase.rpc('set_member_membership', { target: str('id', 40), tier: str('membership', 20) });
      return done(error);
    }
    case 'member.points': {
      const { error } = await supabase.rpc('adjust_points', { target: str('id', 40), delta: int('delta') || 0, reason: str('reason', 200) });
      return done(error);
    }
    case 'report.resolve': {
      const { error } = await supabase.from('reports').update({ status: str('status') === 'dismissed' ? 'dismissed' : 'resolved', resolved_by: user.id, resolved_at: new Date().toISOString() }).eq('id', int('id'));
      return done(error);
    }

    // ---------- cursos ----------
    case 'course.save': {
      const values: Record<string, unknown> = {
        title: str('title', 160), slug: slugify(str('slug', 80) || str('title', 160)).slice(0, 80), description: str('description', 2000),
        access: ['open', 'level', 'paid', 'private'].includes(str('access')) ? str('access') : 'open',
        unlock_level: Math.min(9, Math.max(1, int('unlock_level') || 1)), position: int('position') || 0, published: bool('published'),
      };
      const up = await uploadImage(supabase, fd.get('cover'), { bucket: 'media', folder: 'admin/cursos', maxBytes: 5 * 1024 * 1024 });
      if (up && 'error' in up) return ctx.redirect(withMsg(back, 'error', 'archivo'));
      if (up) values.cover_url = up.url;
      const id = int('id');
      const res = Number.isInteger(id)
        ? await supabase.from('courses').update(values).eq('id', id).select('id').single()
        : await supabase.from('courses').insert(values).select('id').single();
      return done(res.error, res.data ? `/comunidad/admin/cursos/${res.data.id}` : back);
    }
    case 'course.delete': {
      const { error } = await supabase.from('courses').delete().eq('id', int('id'));
      return done(error, '/comunidad/admin/cursos');
    }
    case 'module.save': {
      const id = int('id');
      const values = { course_id: int('course_id'), title: str('title', 160), position: int('position') || 0 };
      const { error } = Number.isInteger(id) ? await supabase.from('modules').update(values).eq('id', id) : await supabase.from('modules').insert(values);
      return done(error);
    }
    case 'module.delete': {
      const { error } = await supabase.from('modules').delete().eq('id', int('id'));
      return done(error);
    }
    case 'lesson.save': {
      // Recursos: una línea por recurso "Nombre | https://..." o "Nombre | recursos:carpeta/archivo.pdf" (bucket privado)
      const resources = str('resources', 4000).split('\n').map((l) => l.split('|').map((x) => x.trim())).filter(([label, ref]) => label && ref).slice(0, 20)
        .map(([label, ref]) => (ref.startsWith('recursos:') ? { label, path: ref.slice(9) } : /^https:\/\//.test(ref) ? { label, url: ref } : null)).filter(Boolean);
      const id = int('id');
      const values = {
        module_id: int('module_id'), title: str('title', 160), slug: slugify(str('slug', 80) || str('title', 160)).slice(0, 80),
        body_md: str('body_md', 100000), video_url: str('video_url', 500) || null, resources, position: int('position') || 0, published: bool('published'),
      };
      const { error } = Number.isInteger(id) ? await supabase.from('lessons').update(values).eq('id', id) : await supabase.from('lessons').insert(values);
      return done(error);
    }
    case 'lesson.delete': {
      const { error } = await supabase.from('lessons').delete().eq('id', int('id'));
      return done(error);
    }
    case 'grant.add': {
      const { data: target } = await supabase.from('profiles').select('id').eq('username', str('username', 30)).maybeSingle();
      if (!target) return ctx.redirect(withMsg(back, 'error', 'desconocido'));
      const { error } = await supabase.from('course_grants').upsert({ course_id: int('course_id'), user_id: target.id });
      return done(error);
    }
    case 'grant.remove': {
      const { error } = await supabase.from('course_grants').delete().eq('course_id', int('course_id')).eq('user_id', str('user_id', 40));
      return done(error);
    }

    // ---------- acciones rápidas ----------
    case 'broadcast': {
      const link = str('link', 300);
      const { data, error } = await supabase.rpc('broadcast_notification', { p_text: str('text', 300), p_link: link.startsWith('/') ? link : null });
      if (error) return done(error);
      return ctx.redirect(withMsg(back, 'ok', `aviso_${data}`));
    }
    case 'announce': {
      // Publicación fijada en Anuncios (y aviso a todos si se marca)
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', 'anuncios').maybeSingle();
      const { data: post, error } = await supabase.from('posts').insert({
        author_id: user.id, category_id: cat?.id ?? int('category_id'), title: str('title', 160), body_md: str('body_md', 20000), pinned: bool('pinned'),
      }).select('id').single();
      if (error) return done(error);
      if (bool('notify')) await supabase.rpc('broadcast_notification', { p_text: `Nuevo anuncio: ${str('title', 160)}`, p_link: `/comunidad/p/${post.id}` });
      return done(null, `/comunidad/p/${post.id}`);
    }
    case 'join.approve_all': {
      const { data: pending } = await supabase.from('join_requests').select('id').eq('status', 'pending');
      for (const r of pending ?? []) {
        const { error } = await supabase.rpc('review_join_request', { p_request: r.id, approve: true });
        if (error) return done(error);
      }
      return done(null);
    }
    case 'approval_mode': {
      const { error } = await supabase.from('community_settings').update({ approval_mode: str('mode') === 'manual' ? 'manual' : 'auto', updated_at: new Date().toISOString() }).eq('id', 1);
      return done(error);
    }

    // ---------- recursos gratis ----------
    case 'resource.save': {
      const slug = slugify(str('slug', 60)).slice(0, 60);
      if (slug.length < 2) return ctx.redirect(withMsg(back, 'error', 'desconocido'));
      const values: Record<string, unknown> = {
        slug, title: str('title', 160), description_md: str('description_md', 10000),
        external_url: /^https:\/\//.test(str('external_url', 1000)) ? str('external_url', 1000) : null,
        published: bool('published'),
      };
      const cover = await uploadImage(supabase, fd.get('cover'), { bucket: 'media', folder: 'admin/recursos', maxBytes: 5 * 1024 * 1024 });
      if (cover && 'error' in cover) return ctx.redirect(withMsg(back, 'error', 'archivo'));
      if (cover) values.cover_url = cover.url;
      // Archivo descargable: bucket privado "recursos", carpeta gratis/<slug>/
      const file = fd.get('file');
      if (file instanceof File && file.size > 0) {
        if (file.size > 50 * 1024 * 1024) return ctx.redirect(withMsg(back, 'error', 'archivo'));
        const name = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-100) || 'archivo';
        const path = `gratis/${slug}/${Date.now()}-${name}`;
        const { error: upErr } = await supabase.storage.from('recursos').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (upErr) return ctx.redirect(withMsg(back, 'error', 'archivo'));
        values.file_path = path;
        values.file_name = name.replace(/^\d+-/, '');
      }
      if (str('remove_file')) { values.file_path = null; values.file_name = null; }
      const id = int('id');
      const res = Number.isInteger(id)
        ? await supabase.from('resources').update(values).eq('id', id).select('id').single()
        : await supabase.from('resources').insert(values).select('id').single();
      return done(res.error);
    }
    case 'resource.delete': {
      const { error } = await supabase.from('resources').delete().eq('id', int('id'));
      return done(error);
    }

    // ---------- eventos ----------
    case 'event.save': {
      const startsAt = chileLocalToIso(str('starts_at', 20));
      const endsAt = str('ends_at', 20) ? chileLocalToIso(str('ends_at', 20)) : null;
      if (!startsAt) return ctx.redirect(withMsg(back, 'error', 'desconocido'));
      const rec = str('recurrence');
      const values = {
        title: str('title', 160), description_md: str('description_md', 5000), starts_at: startsAt, ends_at: endsAt,
        location_url: /^https:\/\//.test(str('location_url', 500)) ? str('location_url', 500) : null,
        recurrence_rule: rec === 'monthly' ? 'FREQ=MONTHLY' : rec === 'weekly' ? 'FREQ=WEEKLY' : null,
      };
      const id = int('id');
      const { error } = Number.isInteger(id) ? await supabase.from('events').update(values).eq('id', id) : await supabase.from('events').insert({ ...values, created_by: user.id });
      return done(error);
    }
    case 'event.delete': {
      const { error } = await supabase.from('events').delete().eq('id', int('id'));
      return done(error);
    }
  }
  return ctx.redirect(back);
};
