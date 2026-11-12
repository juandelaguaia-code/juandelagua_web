-- =====================================================================
-- Recursos gratis (lead magnets): "comenta SKILL y te mando el link"
-- La ficha del recurso es pública (comunidad.juandelagua.com/recursos/skill).
-- Para descargarlo hay que tener cuenta en la comunidad con el correo confirmado.
-- Los archivos van al bucket privado "recursos", carpeta "gratis/<slug>/".
-- =====================================================================

create table public.resources (
  id bigint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'), -- la palabra clave del reel
  title text not null check (char_length(title) between 3 and 160),
  description_md text not null default '',
  cover_url text,
  file_path text,       -- archivo en el bucket privado "recursos"
  file_name text,
  external_url text,    -- o un link externo (Notion, Drive, etc.)
  published boolean not null default false,
  download_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (file_path is not null or external_url is not null or not published)
);

create table public.resource_downloads (
  resource_id bigint not null references public.resources (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  times int not null default 1,
  primary key (resource_id, user_id)
);
create index resource_downloads_user_idx on public.resource_downloads (user_id);

-- ¿El usuario actual confirmó su correo? (lo usan las políticas de storage)
create or replace function public.email_verified()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users u where u.id = (select auth.uid()) and u.email_confirmed_at is not null)
$$;

-- Entrega el archivo o link del recurso solo a cuentas con correo confirmado (no expulsadas) y registra la descarga
create or replace function public.resource_access(p_slug text)
returns table (file_path text, file_name text, external_url text)
language plpgsql security definer set search_path = '' as $$
declare
  r public.resources;
begin
  if not public.email_verified() then raise exception 'email_not_verified'; end if;
  if exists (select 1 from public.profiles where id = (select auth.uid()) and status = 'banned') then raise exception 'forbidden'; end if;
  select * into r from public.resources where slug = p_slug and published;
  if r.id is null then raise exception 'not_found'; end if;
  insert into public.resource_downloads as d (resource_id, user_id) values (r.id, (select auth.uid()))
    on conflict (resource_id, user_id) do update set last_at = now(), times = d.times + 1;
  update public.resources set download_count = download_count + 1 where id = r.id;
  return query select r.file_path, r.file_name, r.external_url;
end $$;

create or replace function public.resources_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger resources_touch before update on public.resources for each row execute function public.resources_touch();

alter table public.resources enable row level security;
alter table public.resource_downloads enable row level security;

-- Ficha pública (sin el archivo ni el link: esos solo vía resource_access)
create policy resources_read on public.resources for select using (published or public.has_role('admin'));
create policy resources_admin on public.resources for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
revoke select on public.resources from anon, authenticated;
grant select (id, slug, title, description_md, cover_url, file_name, published, download_count, created_at, updated_at) on public.resources to anon, authenticated;

create policy downloads_read on public.resource_downloads for select to authenticated using (user_id = (select auth.uid()) or public.has_role('admin'));
revoke insert, update, delete on public.resource_downloads from anon, authenticated;

-- Para editar en el panel, el admin lee el archivo/link con esta función
create or replace function public.resource_admin_links(p_id bigint)
returns table (file_path text, external_url text)
language sql stable security definer set search_path = '' as $$
  select r.file_path, r.external_url from public.resources r where r.id = p_id and public.has_role('admin')
$$;

revoke execute on function public.resource_access(text), public.resource_admin_links(bigint), public.email_verified() from public, anon;
grant execute on function public.resource_access(text), public.resource_admin_links(bigint), public.email_verified() to authenticated;
revoke execute on function public.resources_touch() from public, anon, authenticated;

-- Storage: las cuentas con correo confirmado pueden generar el link de descarga de la carpeta "gratis/"
create policy recursos_gratis_read on storage.objects for select to authenticated
  using (bucket_id = 'recursos' and (storage.foldername(name))[1] = 'gratis' and public.email_verified());

-- Más tipos de archivo para skills y plantillas
update storage.buckets
  set allowed_mime_types = array['application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream',
    'text/plain', 'text/markdown', 'text/x-markdown', 'text/csv', 'image/png', 'image/jpeg', 'image/webp', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      file_size_limit = 50 * 1024 * 1024
  where id = 'recursos';
