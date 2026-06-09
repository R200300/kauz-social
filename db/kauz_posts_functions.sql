-- Kauz — Posts & Feed functionality
-- Run this in your Supabase SQL Editor AFTER kauz_schema.sql.
-- It adds: count-maintenance triggers, the "posts" storage bucket + policies,
-- and enables realtime on posts & comments.

-- =========================================================
-- COUNT MAINTENANCE TRIGGERS
-- (security definer so they bypass RLS and can update other users' rows)
-- =========================================================

-- profiles.posts_count
create or replace function public.handle_posts_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set posts_count = posts_count + 1 where id = new.user_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.profiles set posts_count = greatest(posts_count - 1, 0) where id = old.user_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_posts_count on public.posts;
create trigger trg_posts_count
  after insert or delete on public.posts
  for each row execute function public.handle_posts_count();

-- posts.likes_count
create or replace function public.handle_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_likes_count on public.likes;
create trigger trg_likes_count
  after insert or delete on public.likes
  for each row execute function public.handle_likes_count();

-- posts.comments_count
create or replace function public.handle_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_comments_count on public.comments;
create trigger trg_comments_count
  after insert or delete on public.comments
  for each row execute function public.handle_comments_count();

-- =========================================================
-- STORAGE BUCKET: posts (public read)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

drop policy if exists "Post media is publicly readable" on storage.objects;
create policy "Post media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'posts');

drop policy if exists "Users can upload to own folder" on storage.objects;
create policy "Users can upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own post media" on storage.objects;
create policy "Users can delete own post media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;