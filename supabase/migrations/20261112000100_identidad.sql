-- =====================================================================
-- Identidad, jerarquía, consentimientos y auditoría
-- Roles (qué puede hacer) y membresía (qué contenido ve) son ejes independientes.
-- Los permisos se validan en la base de datos (RLS + funciones security definer).
-- =====================================================================

create extension if not exists citext with schema extensions;

create type public.app_role as enum ('owner', 'admin', 'moderator', 'member');
create type public.account_status as enum ('pending', 'active', 'suspended', 'banned');
create type public.membership_tier as enum ('free', 'founder', 'paid', 'comp');

-- ---------------------------------------------------------------------
-- Niveles (gamificación tipo Skool)
-- ---------------------------------------------------------------------
create table public.levels (
  level int primary key check (level between 1 and 9),
  name text not null,
  min_points int not null check (min_points >= 0)
);
insert into public.levels (level, name, min_points) values
  (1, 'Gota', 0), (2, 'Arroyo', 5), (3, 'Río', 20), (4, 'Corriente', 65), (5, 'Marea', 155),
  (6, 'Ola', 515), (7, 'Oleaje', 2015), (8, 'Océano', 8015), (9, 'Mar abierto', 33015);

-- ---------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  full_name text not null default '' check (char_length(full_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  bio text not null default '' check (char_length(bio) <= 500),
  location text not null default '' check (char_length(location) <= 80),
  links jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 5),
  role public.app_role not null default 'member',
  status public.account_status not null default 'pending',
  membership public.membership_tier not null default 'free',
  suspended_until timestamptz,
  points int not null default 0,
  level int not null default 1 references public.levels (level),
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);
-- Un único owner
create unique index profiles_single_owner on public.profiles (role) where role = 'owner';
create index profiles_points_idx on public.profiles (points desc);

-- Rango numérico de cada rol
create or replace function public.role_rank(r public.app_role)
returns int language sql immutable set search_path = '' as $$
  select case r when 'owner' then 4 when 'admin' then 3 when 'moderator' then 2 else 1 end
$$;

-- ¿El usuario actual tiene al menos este rol y está activo?
create or replace function public.has_role(min_role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.status in ('active', 'suspended')
      and public.role_rank(p.role) >= public.role_rank(min_role)
  )
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_role('moderator')
$$;

-- Puede LEER la comunidad (activo o silenciado)
create or replace function public.is_member_reader()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status in ('active', 'suspended')
  )
$$;

-- Puede ESCRIBIR en la comunidad: activo (o con el silencio vencido) y correo verificado
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and (p.status = 'active' or (p.status = 'suspended' and p.suspended_until is not null and p.suspended_until < now()))
  )
$$;

-- Nivel según puntos
create or replace function public.level_for_points(pts int)
returns int language sql stable set search_path = '' as $$
  select coalesce(max(level), 1) from public.levels where min_points <= greatest(pts, 0)
$$;

-- ---------------------------------------------------------------------
-- Ajustes de la comunidad (una fila)
-- ---------------------------------------------------------------------
create table public.community_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'Comunidad Corriente',
  tagline text not null default 'IA sin programar, con el proceso real en 1 minuto y en español chileno.',
  approval_mode text not null default 'manual' check (approval_mode in ('manual', 'auto')),
  join_questions jsonb not null default '[
    {"id":"oficio","label":"¿A qué te dedicas?","required":true},
    {"id":"automatizar","label":"¿Qué te gustaría automatizar o resolver con IA?","required":true},
    {"id":"origen","label":"¿Cómo conociste la comunidad?","required":false}
  ]'::jsonb,
  price_clp int not null default 0,
  rules_md text not null default '1. Trato respetuoso, de tú a tú.
2. Nada de spam ni autopromoción fuera de la categoría Presentaciones.
3. No publiques datos personales de tus clientes.
4. Pregunta sin miedo: aquí todos estamos aprendiendo.
5. Muestra tu avance, con errores incluidos.',
  welcome_course_slug text,
  updated_at timestamptz not null default now()
);
insert into public.community_settings (id) values (1);

-- ---------------------------------------------------------------------
-- Solicitudes de ingreso
-- ---------------------------------------------------------------------
create table public.join_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Consentimientos (Ley 21.719): versión y fecha
-- ---------------------------------------------------------------------
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('terms', 'privacy', 'rules', 'marketing_email')),
  version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_hash text
);
create index consents_user_idx on public.consents (user_id);

-- ---------------------------------------------------------------------
-- Auditoría
-- ---------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.audit(p_action text, p_target_type text, p_target_id text, p_meta jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, meta)
  values ((select auth.uid()), p_action, p_target_type, p_target_id, coalesce(p_meta, '{}'::jsonb))
$$;
revoke execute on function public.audit(text, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Alta de usuario: crea el perfil al registrarse en auth.users
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'miembro'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := base || 'miembro'; end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate::extensions.citext) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  -- Consentimientos aceptados en el formulario de registro (versión de cada documento)
  if new.raw_user_meta_data ? 'terms_version' then
    insert into public.consents (user_id, kind, version)
    values (new.id, 'terms', left(new.raw_user_meta_data ->> 'terms_version', 10)),
           (new.id, 'privacy', left(coalesce(new.raw_user_meta_data ->> 'privacy_version', ''), 10));
  end if;
  if (new.raw_user_meta_data ->> 'marketing_email') = 'true' then
    insert into public.consents (user_id, kind, version) values (new.id, 'marketing_email', left(coalesce(new.raw_user_meta_data ->> 'privacy_version', ''), 10));
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Funciones de administración (validan permisos y dejan registro en audit_log)
-- ---------------------------------------------------------------------

-- Cambiar rol. Owner: nombra o quita admins y moderadores. Admin: moderadores y miembros.
-- Nadie se cambia el rol a sí mismo, nadie toca al owner y nadie nombra a otro owner.
create or replace function public.set_member_role(target uuid, new_role public.app_role)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  them public.profiles;
begin
  select * into me from public.profiles where id = (select auth.uid());
  select * into them from public.profiles where id = target;
  if me.id is null or them.id is null then raise exception 'not_found'; end if;
  if me.id = them.id then raise exception 'cannot_change_own_role'; end if;
  if new_role = 'owner' or them.role = 'owner' then raise exception 'owner_is_immutable'; end if;
  if me.status <> 'active' or public.role_rank(me.role) < 3 then raise exception 'forbidden'; end if;
  if me.role = 'admin' and (public.role_rank(them.role) >= 3 or public.role_rank(new_role) >= 3) then
    raise exception 'forbidden';
  end if;
  update public.profiles set role = new_role where id = target;
  perform public.audit('role.change', 'profile', target::text, jsonb_build_object('from', them.role, 'to', new_role));
end $$;

-- Cambiar estado: moderador+ aprueba y silencia; admin+ banea o reactiva. Nunca sobre sí mismo
-- ni sobre alguien de rango igual o mayor (salvo el owner).
create or replace function public.set_member_status(target uuid, new_status public.account_status, until timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  them public.profiles;
begin
  select * into me from public.profiles where id = (select auth.uid());
  select * into them from public.profiles where id = target;
  if me.id is null or them.id is null then raise exception 'not_found'; end if;
  if me.id = them.id then raise exception 'cannot_change_own_status'; end if;
  if them.role = 'owner' then raise exception 'owner_is_immutable'; end if;
  if me.status <> 'active' or public.role_rank(me.role) < 2 then raise exception 'forbidden'; end if;
  if me.role <> 'owner' and public.role_rank(them.role) >= public.role_rank(me.role) then raise exception 'forbidden'; end if;
  if new_status = 'banned' and public.role_rank(me.role) < 3 then raise exception 'forbidden'; end if;
  if new_status = 'suspended' and until is null then raise exception 'suspension_needs_date'; end if;
  update public.profiles
    set status = new_status, suspended_until = case when new_status = 'suspended' then until else null end
    where id = target;
  perform public.audit('status.change', 'profile', target::text,
    jsonb_build_object('from', them.status, 'to', new_status, 'until', until));
end $$;

-- Cambiar membresía (p. ej. cortesía). Solo admin+.
create or replace function public.set_member_membership(target uuid, tier public.membership_tier)
returns void language plpgsql security definer set search_path = '' as $$
declare
  old public.membership_tier;
begin
  if not public.has_role('admin') then raise exception 'forbidden'; end if;
  select membership into old from public.profiles where id = target;
  if not found then raise exception 'not_found'; end if;
  update public.profiles set membership = tier where id = target;
  perform public.audit('membership.change', 'profile', target::text, jsonb_build_object('from', old, 'to', tier));
end $$;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.levels enable row level security;
alter table public.profiles enable row level security;
alter table public.community_settings enable row level security;
alter table public.join_requests enable row level security;
alter table public.consents enable row level security;
alter table public.audit_log enable row level security;

-- levels: todos leen; admin+ edita
create policy levels_read on public.levels for select using (true);
create policy levels_admin on public.levels for update to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- profiles: cada uno ve el suyo; los miembros ven los perfiles activos; el staff ve todos
create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_read_members on public.profiles for select to authenticated
  using (status in ('active', 'suspended') and public.is_member_reader());
create policy profiles_read_staff on public.profiles for select to authenticated using (public.is_staff());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Solo estas columnas se pueden editar directamente. Rol, estado, membresía y puntos: solo vía funciones.
revoke update on public.profiles from anon, authenticated;
grant update (username, full_name, avatar_url, bio, location, links, last_seen_at) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

-- community_settings: lectura pública (página de ingreso); admin+ edita
create policy settings_read on public.community_settings for select using (true);
create policy settings_admin on public.community_settings for update to authenticated
  using (public.has_role('admin')) with check (public.has_role('admin'));

-- join_requests: cada uno crea y ve la suya; moderador+ ve todas (se aprueban con review_join_request)
create policy jr_insert_self on public.join_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null);
create policy jr_update_self on public.join_requests for update to authenticated
  using (user_id = (select auth.uid()) and status = 'pending')
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null);
create policy jr_read on public.join_requests for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());

-- consents: cada uno registra y ve los suyos; puede revocarlos
create policy consents_insert_self on public.consents for insert to authenticated with check (user_id = (select auth.uid()) and revoked_at is null);
create policy consents_read_self on public.consents for select to authenticated using (user_id = (select auth.uid()) or public.has_role('admin'));
create policy consents_revoke_self on public.consents for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke update on public.consents from anon, authenticated;
grant update (revoked_at) on public.consents to authenticated;

-- audit_log: solo admin+ lee; nadie escribe directo
create policy audit_read on public.audit_log for select to authenticated using (public.has_role('admin'));
revoke insert, update, delete on public.audit_log from anon, authenticated;
