-- =====================================================================
-- Classroom (cursos → módulos → lecciones) y calendario
-- =====================================================================

create table public.courses (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  description text not null default '',
  cover_url text,
  access text not null default 'open' check (access in ('open', 'level', 'paid', 'private')),
  unlock_level int not null default 1 check (unlock_level between 1 and 9),
  position int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.course_grants (
  course_id bigint not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create table public.modules (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses (id) on delete cascade,
  title text not null,
  position int not null default 0
);
create index modules_course_idx on public.modules (course_id, position);

create table public.lessons (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.modules (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  body_md text not null default '',
  video_url text,
  resources jsonb not null default '[]'::jsonb,
  position int not null default 0,
  published boolean not null default false,
  unique (module_id, slug)
);
create index lessons_module_idx on public.lessons (module_id, position);

create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id bigint not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ¿El usuario actual puede ver el contenido de este curso?
create or replace function public.can_access_course(p_course bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when public.has_role('admin') then true
    when not public.is_member_reader() then false
    else exists (
      select 1 from public.courses c, public.profiles p
      where c.id = p_course and p.id = (select auth.uid()) and c.published
        and (
          c.access = 'open'
          or (c.access = 'level' and p.level >= c.unlock_level)
          or (c.access = 'paid' and p.membership in ('founder', 'paid', 'comp'))
          or exists (select 1 from public.course_grants g where g.course_id = c.id and g.user_id = p.id)
        )
    )
  end
$$;

-- ---------------------------------------------------------------------
-- Calendario
-- ---------------------------------------------------------------------
create table public.events (
  id bigint generated always as identity primary key,
  title text not null,
  description_md text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz,
  tz text not null default 'America/Santiago',
  location_url text, -- link de Meet: solo miembros activos (ver event_location)
  recurrence_rule text check (recurrence_rule is null or recurrence_rule ~ '^FREQ=(WEEKLY|MONTHLY)'),
  cover_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index events_starts_idx on public.events (starts_at);

create table public.event_rsvps (
  event_id bigint not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'maybe', 'no')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- El link de la reunión solo se entrega a miembros activos
create or replace function public.event_location(p_event bigint)
returns text language sql stable security definer set search_path = '' as $$
  select e.location_url from public.events e where e.id = p_event and public.is_member_reader()
$$;

-- Al crear un evento se avisa a los miembros activos
create or replace function public.events_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, type, payload)
  select p.id, 'event', jsonb_build_object('event_id', new.id, 'title', new.title, 'starts_at', new.starts_at)
  from public.profiles p where p.status = 'active' and p.id is distinct from new.created_by;
  return null;
end $$;
create trigger events_notify after insert on public.events for each row execute function public.events_notify();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.course_grants enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

-- Cursos publicados: el catálogo (título, descripción) es visible para cualquiera; admin+ gestiona
create policy courses_read on public.courses for select using (published or public.has_role('admin'));
create policy courses_admin on public.courses for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy grants_read on public.course_grants for select to authenticated using (user_id = (select auth.uid()) or public.has_role('admin'));
create policy grants_admin on public.course_grants for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Módulos: el temario de cursos publicados lo ven los miembros
create policy modules_read on public.modules for select to authenticated
  using (public.has_role('admin') or (public.is_member_reader() and exists (select 1 from public.courses c where c.id = course_id and c.published)));
create policy modules_admin on public.modules for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Lecciones: el contenido solo si el curso es accesible (nivel, membresía o acceso manual)
create policy lessons_read on public.lessons for select to authenticated
  using (public.has_role('admin') or (published and public.can_access_course((select m.course_id from public.modules m where m.id = module_id))));
create policy lessons_admin on public.lessons for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Títulos de lecciones publicadas (para mostrar el temario aunque el curso esté bloqueado)
create or replace function public.course_outline(p_course bigint)
returns table (module_id bigint, module_title text, module_position int, lesson_id bigint, lesson_slug text, lesson_title text, lesson_position int)
language sql stable security definer set search_path = '' as $$
  select m.id, m.title, m.position, l.id, l.slug, l.title, l.position
  from public.modules m
  join public.courses c on c.id = m.course_id
  left join public.lessons l on l.module_id = m.id and l.published
  where m.course_id = p_course and public.is_member_reader() and (c.published or public.has_role('admin'))
  order by m.position, m.id, l.position, l.id
$$;

create policy progress_own on public.lesson_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.is_member_reader());

-- Eventos: título y fecha visibles para todos; el link solo vía event_location(); staff gestiona
create policy events_read on public.events for select using (true);
create policy events_staff on public.events for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
revoke select on public.events from anon, authenticated;
grant select (id, title, description_md, starts_at, ends_at, tz, recurrence_rule, cover_url, created_by, created_at) on public.events to anon, authenticated;

create policy rsvps_read on public.event_rsvps for select to authenticated using (public.is_member_reader());
create policy rsvps_own on public.event_rsvps for insert to authenticated with check (user_id = (select auth.uid()) and public.is_active_member());
create policy rsvps_update on public.event_rsvps for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy rsvps_delete on public.event_rsvps for delete to authenticated using (user_id = (select auth.uid()));
