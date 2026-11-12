-- =====================================================================
-- Feed: categorías, publicaciones, comentarios, me gusta, puntos,
-- reportes y notificaciones
-- =====================================================================

create table public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  emoji text not null default '',
  position int not null default 0,
  admins_only_post boolean not null default false
);
insert into public.categories (slug, name, emoji, position, admins_only_post) values
  ('anuncios', 'Anuncios', '📣', 0, true),
  ('preguntas', 'Preguntas', '❓', 1, false),
  ('avance', 'Muestra tu avance', '🚀', 2, false),
  ('plantillas', 'Plantillas', '🧩', 3, false),
  ('herramientas', 'Herramientas', '🛠️', 4, false),
  ('presentaciones', 'Presentaciones', '👋', 5, false);

create table public.posts (
  id bigint generated always as identity primary key,
  author_id uuid references public.profiles (id) on delete set null,
  category_id bigint not null references public.categories (id),
  title text not null check (char_length(title) between 3 and 160),
  body_md text not null default '' check (char_length(body_md) <= 20000),
  media jsonb not null default '{}'::jsonb,
  poll jsonb,
  pinned boolean not null default false,
  locked boolean not null default false,
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index posts_feed_idx on public.posts (pinned desc, created_at desc) where deleted_at is null;
create index posts_category_idx on public.posts (category_id, created_at desc);
create index posts_author_idx on public.posts (author_id);

create table public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  parent_id bigint references public.comments (id) on delete cascade,
  body_md text not null check (char_length(body_md) between 1 and 5000),
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

-- Votos de encuestas (una opción por persona)
create table public.poll_votes (
  post_id bigint not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  option_index int not null check (option_index between 0 and 9),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index likes_target_idx on public.likes (target_type, target_id);

create table public.points_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  reason text not null,
  source_type text,
  source_id text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index points_ledger_created_user_idx on public.points_ledger (created_at, user_id);
create index points_ledger_user_idx on public.points_ledger (user_id);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('post', 'comment', 'profile')),
  target_id text not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('reply', 'comment', 'mention', 'like', 'event', 'approved', 'system')),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_digest text not null default 'weekly' check (email_digest in ('off', 'daily', 'weekly')),
  on_reply boolean not null default true,
  on_mention boolean not null default true,
  on_like boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Notificaciones (respeta las preferencias)
-- ---------------------------------------------------------------------
create or replace function public.notify(p_user uuid, p_type text, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  prefs public.notification_prefs;
begin
  if p_user is null or p_user = (select auth.uid()) then return; end if;
  select * into prefs from public.notification_prefs where user_id = p_user;
  if found then
    if p_type in ('reply', 'comment') and not prefs.on_reply then return; end if;
    if p_type = 'mention' and not prefs.on_mention then return; end if;
    if p_type = 'like' and not prefs.on_like then return; end if;
  end if;
  insert into public.notifications (user_id, type, payload) values (p_user, p_type, p_payload);
end $$;
revoke execute on function public.notify(uuid, text, jsonb) from public, anon, authenticated;

-- Menciones @usuario en un texto
create or replace function public.notify_mentions(p_body text, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  u uuid;
begin
  for u in
    select distinct p.id from public.profiles p
    where p.status in ('active', 'suspended')
      and p.username in (select (regexp_matches(p_body, '(?:^|[^a-zA-Z0-9_])@([a-zA-Z0-9_]{3,30})', 'g'))[1]::extensions.citext)
    limit 20
  loop
    perform public.notify(u, 'mention', p_payload);
  end loop;
end $$;
revoke execute on function public.notify_mentions(text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Reglas de integridad en publicaciones y comentarios
-- ---------------------------------------------------------------------
create or replace function public.posts_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  staff boolean := public.is_staff();
begin
  if tg_op = 'INSERT' then
    new.like_count := 0;
    new.comment_count := 0;
    new.created_at := now();
    new.edited_at := null;
    new.deleted_at := null;
    if not staff then new.pinned := false; new.locked := false; end if;
  else
    new.id := old.id;
    new.author_id := old.author_id;
    new.created_at := old.created_at;
    if not staff then
      new.pinned := old.pinned;
      new.locked := old.locked;
      -- Un miembro solo puede borrar lo suyo, no "desborrarlo"
      if old.deleted_at is not null then new.deleted_at := old.deleted_at; end if;
    end if;
    if new.title is distinct from old.title or new.body_md is distinct from old.body_md then
      new.edited_at := now();
    end if;
  end if;
  -- Categorías solo para admins (Anuncios)
  if (select c.admins_only_post from public.categories c where c.id = new.category_id) and not public.has_role('admin') then
    if tg_op = 'INSERT' or new.category_id is distinct from old.category_id then
      raise exception 'category_admins_only';
    end if;
  end if;
  return new;
end $$;
create trigger posts_guard before insert or update on public.posts for each row execute function public.posts_guard();

create or replace function public.comments_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  parent public.comments;
begin
  if tg_op = 'INSERT' then
    new.like_count := 0;
    new.created_at := now();
    new.edited_at := null;
    new.deleted_at := null;
    if (select locked from public.posts where id = new.post_id) and not public.is_staff() then
      raise exception 'post_locked';
    end if;
    if new.parent_id is not null then
      select * into parent from public.comments where id = new.parent_id;
      -- Un solo nivel de respuesta: si responden a una respuesta, cuelga del comentario raíz
      if parent.id is null or parent.post_id <> new.post_id then raise exception 'bad_parent'; end if;
      if parent.parent_id is not null then new.parent_id := parent.parent_id; end if;
    end if;
  else
    new.id := old.id;
    new.post_id := old.post_id;
    new.parent_id := old.parent_id;
    new.author_id := old.author_id;
    new.created_at := old.created_at;
    if old.deleted_at is not null and not public.is_staff() then new.deleted_at := old.deleted_at; end if;
    if new.body_md is distinct from old.body_md then new.edited_at := now(); end if;
  end if;
  return new;
end $$;
create trigger comments_guard before insert or update on public.comments for each row execute function public.comments_guard();

-- Contador de comentarios y notificaciones de respuesta / mención
create or replace function public.comments_after()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  post public.posts;
  parent_author uuid;
  payload jsonb;
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id returning * into post;
    payload := jsonb_build_object('post_id', new.post_id, 'comment_id', new.id, 'post_title', post.title, 'actor_id', new.author_id);
    if new.parent_id is not null then
      select author_id into parent_author from public.comments where id = new.parent_id;
      perform public.notify(parent_author, 'reply', payload);
    end if;
    if post.author_id is distinct from parent_author then
      perform public.notify(post.author_id, 'comment', payload);
    end if;
    perform public.notify_mentions(new.body_md, payload);
  elsif tg_op = 'UPDATE' then
    if old.deleted_at is null and new.deleted_at is not null then
      update public.posts set comment_count = greatest(comment_count - 1, 0) where id = new.post_id;
    elsif old.deleted_at is not null and new.deleted_at is null then
      update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    end if;
  elsif tg_op = 'DELETE' then
    if old.deleted_at is null then
      update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    end if;
  end if;
  return null;
end $$;
create trigger comments_after after insert or update of deleted_at or delete on public.comments
  for each row execute function public.comments_after();

create or replace function public.posts_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.notify_mentions(new.title || ' ' || new.body_md,
    jsonb_build_object('post_id', new.id, 'post_title', new.title, 'actor_id', new.author_id));
  return null;
end $$;
create trigger posts_after_insert after insert on public.posts for each row execute function public.posts_after_insert();

-- ---------------------------------------------------------------------
-- Me gusta → puntos (1 me gusta recibido = 1 punto; nunca por lo propio)
-- ---------------------------------------------------------------------
create or replace function public.likes_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  author uuid;
begin
  if new.target_type = 'post' then
    select author_id into author from public.posts where id = new.target_id and deleted_at is null;
  else
    select author_id into author from public.comments where id = new.target_id and deleted_at is null;
  end if;
  if not found then raise exception 'target_not_found'; end if;
  if author = new.user_id then raise exception 'cannot_like_own'; end if;
  new.created_at := now();
  return new;
end $$;
create trigger likes_guard before insert on public.likes for each row execute function public.likes_guard();

create or replace function public.likes_after()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rec public.likes;
  author uuid;
  title text;
  post_id bigint;
  d int;
begin
  if tg_op = 'INSERT' then rec := new; d := 1; else rec := old; d := -1; end if;

  if rec.target_type = 'post' then
    update public.posts set like_count = greatest(like_count + d, 0) where id = rec.target_id
      returning author_id, posts.title, id into author, title, post_id;
  else
    update public.comments set like_count = greatest(like_count + d, 0) where id = rec.target_id
      returning author_id, comments.post_id into author, post_id;
  end if;

  if author is null or author = rec.user_id then return null; end if;
  -- Si quien dio el me gusta eliminó su cuenta, el autor conserva el punto
  if d = -1 and not exists (select 1 from public.profiles where id = rec.user_id) then return null; end if;

  insert into public.points_ledger (user_id, delta, reason, source_type, source_id, created_by)
  values (author, d, case when d = 1 then 'like' else 'unlike' end, rec.target_type, rec.target_id::text, rec.user_id);

  if d = 1 then
    perform public.notify(author, 'like', jsonb_build_object('post_id', post_id, 'target_type', rec.target_type, 'target_id', rec.target_id, 'post_title', title, 'actor_id', rec.user_id));
  end if;
  return null;
end $$;
create trigger likes_after after insert or delete on public.likes for each row execute function public.likes_after();

-- Cada movimiento del libro actualiza puntos y nivel del perfil
create or replace function public.points_apply()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
    set points = greatest(points + new.delta, 0),
        level = public.level_for_points(greatest(points + new.delta, 0))
    where id = new.user_id;
  return null;
end $$;
create trigger points_apply after insert on public.points_ledger for each row execute function public.points_apply();

-- Si el admin cambia los umbrales, se recalculan los niveles
create or replace function public.levels_recalc()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set level = public.level_for_points(points);
  return null;
end $$;
create trigger levels_recalc after update of min_points on public.levels for each statement execute function public.levels_recalc();

-- Ajuste manual de puntos (admin+), queda en el libro y en auditoría
create or replace function public.adjust_points(target uuid, delta int, reason text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_role('admin') then raise exception 'forbidden'; end if;
  if target = (select auth.uid()) then raise exception 'cannot_adjust_own'; end if;
  insert into public.points_ledger (user_id, delta, reason, source_type, created_by)
  values (target, delta, coalesce(nullif(reason, ''), 'manual'), 'manual', (select auth.uid()));
  perform public.audit('points.adjust', 'profile', target::text, jsonb_build_object('delta', delta, 'reason', reason));
end $$;

-- Ranking: últimos N días (null = de siempre)
create or replace function public.leaderboard(p_days int default null, p_limit int default 20)
returns table (user_id uuid, username text, full_name text, avatar_url text, level int, points bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username::text, p.full_name, p.avatar_url, p.level,
         case when p_days is null then p.points::bigint else coalesce(sum(l.delta), 0) end as pts
  from public.profiles p
  left join public.points_ledger l
    on l.user_id = p.id and p_days is not null and l.created_at >= now() - make_interval(days => p_days)
  where public.is_member_reader() and p.status in ('active', 'suspended')
  group by p.id
  having (case when p_days is null then p.points::bigint else coalesce(sum(l.delta), 0) end) > 0
  order by pts desc, p.username
  limit least(greatest(p_limit, 1), 100)
$$;

-- Cuántos miembros hay en cada nivel
create or replace function public.level_distribution()
returns table (level int, name text, min_points int, members bigint)
language sql stable security definer set search_path = '' as $$
  select l.level, l.name, l.min_points, count(p.id)
  from public.levels l
  left join public.profiles p on p.level = l.level and p.status in ('active', 'suspended')
  where public.is_member_reader()
  group by l.level order by l.level
$$;

-- ---------------------------------------------------------------------
-- Solicitudes de ingreso: aprobar o rechazar (moderador+), o aprobación automática
-- ---------------------------------------------------------------------
create or replace function public.review_join_request(p_request bigint, approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  req public.join_requests;
begin
  if not public.has_role('moderator') then raise exception 'forbidden'; end if;
  select * into req from public.join_requests where id = p_request;
  if req.id is null then raise exception 'not_found'; end if;
  if req.user_id = (select auth.uid()) then raise exception 'cannot_review_own'; end if;
  update public.join_requests
    set status = case when approve then 'approved' else 'rejected' end, reviewed_by = (select auth.uid()), reviewed_at = now()
    where id = p_request;
  if approve then
    update public.profiles set status = 'active' where id = req.user_id and status = 'pending';
    perform public.notify(req.user_id, 'approved', '{}'::jsonb);
  end if;
  perform public.audit(case when approve then 'join.approve' else 'join.reject' end, 'profile', req.user_id::text, '{}'::jsonb);
end $$;

create or replace function public.join_requests_auto()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select approval_mode from public.community_settings where id = 1) = 'auto' then
    update public.join_requests set status = 'approved', reviewed_at = now() where id = new.id;
    update public.profiles set status = 'active' where id = new.user_id and status = 'pending';
    insert into public.notifications (user_id, type, payload) values (new.user_id, 'approved', '{}'::jsonb);
  end if;
  return null;
end $$;
create trigger join_requests_auto after insert on public.join_requests for each row execute function public.join_requests_auto();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.poll_votes enable row level security;
alter table public.likes enable row level security;
alter table public.points_ledger enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_prefs enable row level security;

-- categorías: miembros leen; admin+ gestiona
create policy categories_read on public.categories for select to authenticated using (public.is_member_reader());
create policy categories_admin on public.categories for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- posts
create policy posts_read on public.posts for select to authenticated
  using (public.is_member_reader() and (deleted_at is null or public.is_staff()));
create policy posts_insert on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_active_member());
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = (select auth.uid()) and public.is_active_member())
  with check (author_id = (select auth.uid()));
create policy posts_update_staff on public.posts for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy posts_delete_staff on public.posts for delete to authenticated using (public.is_staff());
revoke update on public.posts from anon, authenticated;
grant update (category_id, title, body_md, media, poll, pinned, locked, deleted_at) on public.posts to authenticated;

-- comments
create policy comments_read on public.comments for select to authenticated
  using (public.is_member_reader() and (deleted_at is null or public.is_staff()));
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_active_member()
    and exists (select 1 from public.posts p where p.id = post_id and p.deleted_at is null));
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid()) and public.is_active_member()) with check (author_id = (select auth.uid()));
create policy comments_update_staff on public.comments for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy comments_delete_staff on public.comments for delete to authenticated using (public.is_staff());
revoke update on public.comments from anon, authenticated;
grant update (body_md, deleted_at) on public.comments to authenticated;

-- encuestas
create policy poll_votes_read on public.poll_votes for select to authenticated using (public.is_member_reader());
create policy poll_votes_insert on public.poll_votes for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_member()
    and exists (select 1 from public.posts p where p.id = post_id and p.poll is not null and p.deleted_at is null
      and option_index < jsonb_array_length(p.poll -> 'options')));
create policy poll_votes_delete on public.poll_votes for delete to authenticated using (user_id = (select auth.uid()));

-- likes
create policy likes_read on public.likes for select to authenticated using (public.is_member_reader());
create policy likes_insert on public.likes for insert to authenticated with check (user_id = (select auth.uid()) and public.is_active_member());
create policy likes_delete on public.likes for delete to authenticated using (user_id = (select auth.uid()));
revoke update on public.likes from anon, authenticated;

-- puntos: miembros leen (ranking auditable); nadie escribe directo
create policy points_read on public.points_ledger for select to authenticated using (public.is_member_reader());
revoke insert, update, delete on public.points_ledger from anon, authenticated;

-- reportes: cualquier miembro reporta; moderador+ revisa
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and public.is_member_reader() and status = 'open' and resolved_by is null);
create policy reports_read on public.reports for select to authenticated using (public.is_staff() or reporter_id = (select auth.uid()));
create policy reports_update on public.reports for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- notificaciones: solo las propias; solo se puede marcar como leída
create policy notifications_read on public.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = (select auth.uid()));
revoke insert, update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy prefs_all on public.notification_prefs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
