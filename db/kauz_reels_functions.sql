-- Kauz — Reels functionality
-- Run this in your Supabase SQL Editor AFTER kauz_schema.sql + kauz_posts_functions.sql.
-- Safe to re-run. Adds shares_count / views_count columns to posts, security-definer
-- RPCs to increment them (bypassing the owner-only UPDATE policy), and ensures
-- realtime is broadcasting full post rows so counts update live.

-- =========================================================
-- NEW COUNT COLUMNS ON POSTS
-- =========================================================
alter table public.posts
  add column if not exists shares_count int not null default 0,
  add column if not exists views_count int not null default 0;

create index if not exists posts_is_reel_idx on public.posts(is_reel, created_at desc);

-- =========================================================
-- INCREMENT RPCs (security definer -> bypass owner-only RLS update)
-- Anyone (even anon) viewing/sharing a reel can bump these counters,
-- but ONLY these two columns can change through these functions.
-- =========================================================
create or replace function public.increment_post_views(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set views_count = views_count + 1 where id = p_post_id;
end;
$$;

create or replace function public.increment_post_shares(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set shares_count = shares_count + 1 where id = p_post_id;
end;
$$;

grant execute on function public.increment_post_views(uuid) to anon, authenticated;
grant execute on function public.increment_post_shares(uuid) to anon, authenticated;

-- =========================================================
-- REALTIME
-- replica identity full so UPDATE payloads carry every column (live counts).
-- posts is already in the supabase_realtime publication via kauz_posts_functions.sql;
-- the exception block makes this safe to run standalone too.
-- =========================================================
alter table public.posts replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.posts;
  exception when duplicate_object then null;
  end;
end $$;