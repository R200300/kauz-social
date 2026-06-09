-- Kauz — Stories functionality
-- Run this in your Supabase SQL Editor AFTER kauz_schema.sql.
-- It adds: extra story columns (media_type, text_overlay), a story_views table
-- for seen-tracking + viewer lists, a views_count trigger, the "stories"
-- storage bucket + policies, and enables realtime on stories.

-- =========================================================
-- STORIES: extra columns
-- =========================================================
alter table public.stories
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video'));
alter table public.stories
  add column if not exists text_overlay text;

-- =========================================================
-- STORY VIEWS  (who has seen which story)
-- =========================================================
create table if not exists public.story_views (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (story_id, viewer_id)
);
create index if not exists story_views_story_idx on public.story_views(story_id);
create index if not exists story_views_viewer_idx on public.story_views(viewer_id);

grant select, insert on public.story_views to authenticated;
grant all on public.story_views to service_role;

alter table public.story_views enable row level security;

-- A viewer can see their own view rows (needed for "seen" rings), and a story
-- owner can see everyone who viewed their stories (viewer list).
drop policy if exists "View rows visible to viewer and story owner" on public.story_views;
create policy "View rows visible to viewer and story owner"
  on public.story_views for select to authenticated
  using (
    auth.uid() = viewer_id
    or auth.uid() = (select user_id from public.stories where id = story_id)
  );

drop policy if exists "Users can record their own views" on public.story_views;
create policy "Users can record their own views"
  on public.story_views for insert to authenticated
  with check (auth.uid() = viewer_id);

-- =========================================================
-- VIEWS COUNT TRIGGER  (skip self-views)
-- =========================================================
create or replace function public.handle_story_views_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
begin
  select user_id into owner from public.stories where id = new.story_id;
  if owner is distinct from new.viewer_id then
    update public.stories set views_count = views_count + 1 where id = new.story_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_story_views_count on public.story_views;
create trigger trg_story_views_count
  after insert on public.story_views
  for each row execute function public.handle_story_views_count();

-- =========================================================
-- STORAGE BUCKET: stories (public read)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict (id) do nothing;

drop policy if exists "Story media is publicly readable" on storage.objects;
create policy "Story media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'stories');

drop policy if exists "Users can upload own story media" on storage.objects;
create policy "Users can upload own story media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own story media" on storage.objects;
create policy "Users can delete own story media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'stories' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table public.stories;
