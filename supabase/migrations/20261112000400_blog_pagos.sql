-- =====================================================================
-- Blog y suscripciones (pagos de la comunidad, fase posterior)
-- =====================================================================

create table public.blog_categories (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null,
  description text not null default '',
  -- CTA al final del artículo: diagnóstico gratis o comunidad
  cta text not null default 'diagnostico' check (cta in ('diagnostico', 'comunidad'))
);
insert into public.blog_categories (slug, name, description, cta) values
  ('ia-para-pymes', 'IA para pymes', 'Cómo usar inteligencia artificial en una pyme, con criterio y sin humo.', 'diagnostico'),
  ('automatizacion-y-agentes', 'Automatización y agentes', 'Agentes de IA, flujos automáticos e integración de herramientas.', 'diagnostico'),
  ('marketing-y-campanas', 'Marketing y campañas', 'Campañas medidas, contenido y costo por contacto.', 'diagnostico'),
  ('casos', 'Casos', 'Proyectos reales, con cifras y autorización.', 'diagnostico'),
  ('creando-mi-marca', 'Creando mi marca', 'El proceso real de construir la marca Juan del Agua, con errores incluidos.', 'comunidad'),
  ('buen-vivir', 'Buen vivir', 'Tecnología para trabajar mejor y vivir mejor.', 'comunidad');

create table public.blog_posts (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,120}$'),
  title text not null check (char_length(title) between 3 and 160),
  excerpt text not null default '' check (char_length(excerpt) <= 400),
  body_md text not null default '',
  cover_url text,
  cover_alt text,
  category_id bigint references public.blog_categories (id) on delete set null,
  tags text[] not null default '{}',
  series text check (series is null or series ~ '^[a-z0-9-]{2,60}$'),
  author_id uuid references public.profiles (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  canonical_url text,
  reading_minutes int not null default 1,
  -- Aviso a IndexNow ya enviado (lo usa deploy/blog-worker.mjs)
  indexnow_notified_at timestamptz,
  -- Portada con texto alternativo obligatorio
  check (cover_url is null or coalesce(char_length(cover_alt), 0) > 0),
  check (status = 'draft' or published_at is not null)
);
create index blog_posts_published_idx on public.blog_posts (published_at desc) where status <> 'draft';
create index blog_posts_category_idx on public.blog_posts (category_id);
create index blog_posts_series_idx on public.blog_posts (series);

create or replace function public.blog_posts_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.reading_minutes := greatest(1, round(array_length(regexp_split_to_array(trim(new.body_md), '\s+'), 1) / 220.0)::int);
  -- Si el contenido cambia después de publicado, se vuelve a avisar a IndexNow
  if tg_op = 'UPDATE' and (new.body_md is distinct from old.body_md or new.title is distinct from old.title or new.slug is distinct from old.slug) then
    new.indexnow_notified_at := null;
  end if;
  return new;
end $$;
create trigger blog_posts_touch before insert or update on public.blog_posts for each row execute function public.blog_posts_touch();

-- ¿Está visible al público? (publicado, o programado cuya hora ya llegó)
create or replace function public.blog_is_live(p public.blog_posts)
returns boolean language sql stable set search_path = '' as $$
  select p.status in ('published', 'scheduled') and p.published_at <= now()
$$;

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

create policy blog_categories_read on public.blog_categories for select using (true);
create policy blog_categories_admin on public.blog_categories for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- Lectura pública solo de lo publicado (lo programado aparece solo cuando llega su hora)
create policy blog_posts_read on public.blog_posts for select
  using ((status in ('published', 'scheduled') and published_at <= now()) or public.has_role('admin'));
create policy blog_posts_admin on public.blog_posts for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- ---------------------------------------------------------------------
-- Suscripciones (la pasarela se define después; la escribe solo el servidor con service_role)
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null check (plan in ('founder', 'paid')),
  status text not null check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  price_clp int not null,
  locked_price boolean not null default false,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;
create policy subscriptions_read_own on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.has_role('owner'));
revoke insert, update, delete on public.subscriptions from anon, authenticated;
