-- Kauz — Profile functionality
-- Run this in your Supabase SQL Editor AFTER kauz_schema.sql and kauz_posts_functions.sql.
-- It adds: follow-count triggers, the "avatars" storage bucket + policies,
-- story-highlights tables, and a policy so users can read their own expired stories.

-- =========================================================
-- FOLLOW COUNT MAINTENANCE
-- Keeps profiles.followers_count / following_count in sync.
-- security definer so it can update rows owned by other users.
-- =========================================================
create or replace function public.handle_follows_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_follows_count on public.follows;
create trigger trg_follows_count
  after insert or delete on public.follows
  for each row execute function public.handle_follows_count();

-- =========================================================
-- STORAGE BUCKET: avatars (public read)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- STORY HIGHLIGHTS
-- A highlight groups stories (often expired ones) into a permanent circle.
-- =========================================================
create table if not exists public.story_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  cover_url text,
  created_at timestamptz not null default now()
);
create index if not exists story_highlights_user_idx on public.story_highlights(user_id);

grant select on public.story_highlights to anon;
grant select, insert, update, delete on public.story_highlights to authenticated;
grant all on public.story_highlights to service_role;

alter table public.story_highlights enable row level security;

create policy "Highlights are viewable by everyone"
  on public.story_highlights for select using (true);
create policy "Users can create own highlights"
  on public.story_highlights for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own highlights"
  on public.story_highlights for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own highlights"
  on public.story_highlights for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.highlight_items (
  id uuid primary key default gen_random_uuid(),
  highlight_id uuid not null references public.story_highlights(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists highlight_items_highlight_idx on public.highlight_items(highlight_id);

grant select on public.highlight_items to anon;
grant select, insert, update, delete on public.highlight_items to authenticated;
grant all on public.highlight_items to service_role;

alter table public.highlight_items enable row level security;

create policy "Highlight items are viewable by everyone"
  on public.highlight_items for select using (true);
create policy "Users can add own highlight items"
  on public.highlight_items for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete own highlight items"
  on public.highlight_items for delete to authenticated using (auth.uid() = user_id);

-- =========================================================
-- STORIES: let owners read their own expired stories
-- (needed so they can turn expired stories into highlights)
-- =========================================================
drop policy if exists "Owners can view own stories" on public.stories;
create policy "Owners can view own stories"
  on public.stories for select to authenticated
  using (auth.uid() = user_id);