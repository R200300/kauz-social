-- Kauz — Storage buckets setup
-- Run this in your Supabase SQL Editor (safe to re-run).
-- Configures the avatars / posts / stories buckets with size limits and
-- allowed MIME types, plus the access policies on storage.objects.

-- =========================================================
-- BUCKETS (public read, with size + mime constraints)
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('posts',   'posts',   true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4']),
  ('stories', 'stories', true, 31457280, array['image/jpeg','image/png','video/mp4'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================
-- POLICIES
-- Anyone can view public files; only authenticated users can upload;
-- users can only update/delete files inside their own {uid}/ folder.
-- =========================================================
drop policy if exists "Kauz public read" on storage.objects;
create policy "Kauz public read"
  on storage.objects for select
  using (bucket_id in ('avatars', 'posts', 'stories'));

drop policy if exists "Kauz authenticated upload" on storage.objects;
create policy "Kauz authenticated upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'posts', 'stories')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Kauz owner update" on storage.objects;
create policy "Kauz owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'posts', 'stories')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Kauz owner delete" on storage.objects;
create policy "Kauz owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'posts', 'stories')
    and (storage.foldername(name))[1] = auth.uid()::text
  );