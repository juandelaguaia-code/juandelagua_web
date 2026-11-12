-- =====================================================================
-- Storage: avatares, imágenes públicas (portadas, imágenes del feed) y recursos privados de cursos
-- Cada usuario sube solo a su carpeta (<uid>/...). Límite de tamaño y tipo por bucket.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars', 'avatars', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']),
  ('media', 'media', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('recursos', 'recursos', false, 25 * 1024 * 1024, array['application/pdf', 'application/zip', 'text/plain', 'text/markdown', 'text/csv', 'image/png', 'image/jpeg', 'application/json'])
on conflict (id) do nothing;

-- Avatares: cada uno gestiona su carpeta
create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Media: miembros activos suben imágenes del feed a su carpeta; el blog y los cursos (carpeta "admin/") solo admin+
create policy media_insert_member on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_active_member() and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy media_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_role('admin') and (storage.foldername(name))[1] = 'admin');
create policy media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.has_role('admin')));

-- Recursos de cursos: solo admin+ sube; la descarga se entrega con URL firmada desde el servidor
create policy recursos_admin on storage.objects for all to authenticated
  using (bucket_id = 'recursos' and public.has_role('admin'))
  with check (bucket_id = 'recursos' and public.has_role('admin'));
