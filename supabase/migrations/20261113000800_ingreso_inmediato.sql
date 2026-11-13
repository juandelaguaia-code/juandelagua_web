-- =====================================================================
-- Ingreso inmediato: quien se registra entra a la comunidad al confirmar su correo, sin revisión.
-- (Si algún día se quiere revisar a mano: approval_mode = 'manual' en Ajustes.)
-- Las normas se aceptan en el mismo formulario de registro (rules_version en los metadatos).
-- =====================================================================

update public.community_settings set approval_mode = 'auto' where id = 1;
alter table public.community_settings alter column approval_mode set default 'auto';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidate text;
  n int := 0;
  auto boolean := coalesce((select approval_mode = 'auto' from public.community_settings where id = 1), true);
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1), 'miembro'), '[^a-zA-Z0-9_]', '', 'g'));
  if char_length(base) < 3 then base := base || 'miembro'; end if;
  base := left(base, 24);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate::extensions.citext) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, full_name, avatar_url, status)
  values (
    new.id,
    candidate,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    new.raw_user_meta_data ->> 'avatar_url',
    case when auto then 'active'::public.account_status else 'pending'::public.account_status end
  );
  if new.raw_user_meta_data ? 'terms_version' then
    insert into public.consents (user_id, kind, version)
    values (new.id, 'terms', left(new.raw_user_meta_data ->> 'terms_version', 10)),
           (new.id, 'privacy', left(coalesce(new.raw_user_meta_data ->> 'privacy_version', ''), 10));
  end if;
  if new.raw_user_meta_data ? 'rules_version' then
    insert into public.consents (user_id, kind, version) values (new.id, 'rules', left(new.raw_user_meta_data ->> 'rules_version', 10));
  end if;
  if (new.raw_user_meta_data ->> 'marketing_email') = 'true' then
    insert into public.consents (user_id, kind, version) values (new.id, 'marketing_email', left(coalesce(new.raw_user_meta_data ->> 'privacy_version', ''), 10));
  end if;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Quienes quedaron pendientes con el modo anterior pasan a activos
update public.profiles set status = 'active' where status = 'pending';
update public.join_requests set status = 'approved', reviewed_at = now() where status = 'pending';

-- Aviso masivo desde el panel (admin+): una notificación para cada miembro activo
create or replace function public.broadcast_notification(p_text text, p_link text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not public.has_role('admin') then raise exception 'forbidden'; end if;
  if coalesce(char_length(trim(p_text)), 0) < 3 then raise exception 'empty'; end if;
  insert into public.notifications (user_id, type, payload)
  select p.id, 'system', jsonb_build_object('text', left(p_text, 300), 'link', p_link)
  from public.profiles p where p.status in ('active', 'suspended');
  get diagnostics n = row_count;
  perform public.audit('notify.broadcast', 'community', null, jsonb_build_object('text', left(p_text, 300), 'recipients', n));
  return n;
end $$;
revoke execute on function public.broadcast_notification(text, text) from public, anon;
grant execute on function public.broadcast_notification(text, text) to authenticated;

-- Lista de miembros con correo para exportar (solo admin+): el correo vive en auth.users
create or replace function public.admin_member_export()
returns table (username text, full_name text, email text, role public.app_role, status public.account_status,
               membership public.membership_tier, level int, points int, created_at timestamptz, last_seen_at timestamptz, marketing_email boolean)
language sql stable security definer set search_path = '' as $$
  select p.username::text, p.full_name, u.email, p.role, p.status, p.membership, p.level, p.points, p.created_at, p.last_seen_at,
         exists (select 1 from public.consents c where c.user_id = p.id and c.kind = 'marketing_email' and c.revoked_at is null)
  from public.profiles p join auth.users u on u.id = p.id
  where public.has_role('admin')
  order by p.created_at
$$;
revoke execute on function public.admin_member_export() from public, anon;
grant execute on function public.admin_member_export() to authenticated;

-- Quién descargó cada recurso (solo admin+)
create or replace function public.admin_resource_downloads(p_resource bigint)
returns table (username text, full_name text, email text, times int, first_at timestamptz, last_at timestamptz, marketing_email boolean)
language sql stable security definer set search_path = '' as $$
  select p.username::text, p.full_name, u.email, d.times, d.first_at, d.last_at,
         exists (select 1 from public.consents c where c.user_id = p.id and c.kind = 'marketing_email' and c.revoked_at is null)
  from public.resource_downloads d join public.profiles p on p.id = d.user_id join auth.users u on u.id = p.id
  where d.resource_id = p_resource and public.has_role('admin')
  order by d.last_at desc
$$;
revoke execute on function public.admin_resource_downloads(bigint) from public, anon;
grant execute on function public.admin_resource_downloads(bigint) to authenticated;
