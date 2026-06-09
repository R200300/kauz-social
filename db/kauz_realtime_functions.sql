-- Kauz — Real-time DMs, Notifications & AI insights
-- Run this in your Supabase SQL Editor AFTER kauz_schema.sql (safe to re-run).
-- Adds: profiles.last_seen (online status), notification-generation triggers
-- for like/comment/follow, a self-insert policy for ai_insight notifications,
-- and enables realtime on messages + notifications.

-- =========================================================
-- ONLINE STATUS
-- =========================================================
alter table public.profiles
  add column if not exists last_seen timestamptz;

-- =========================================================
-- NOTIFICATION GENERATION TRIGGERS  (security definer -> bypass RLS insert)
-- =========================================================

-- Someone likes your post
create or replace function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id, message)
    values (owner_id, new.user_id, 'like', new.post_id, 'liked your post');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_like on public.likes;
create trigger trg_notify_like
  after insert on public.likes
  for each row execute function public.notify_on_like();

-- Someone comments on your post
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id from public.posts where id = new.post_id;
  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, post_id, message)
    values (owner_id, new.user_id, 'comment',
            new.post_id,
            'commented: "' || left(new.content, 80) || '"');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_comment on public.comments;
create trigger trg_notify_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- Someone follows you
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, message)
  values (new.following_id, new.follower_id, 'follow', 'started following you');
  return new;
end;
$$;

drop trigger if exists trg_notify_follow on public.follows;
create trigger trg_notify_follow
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- =========================================================
-- AI INSIGHTS: allow a user to insert their own ai_insight notifications
-- (generated client-side via Lovable AI). All other types stay service-only.
-- =========================================================
drop policy if exists "Users can insert own ai insights" on public.notifications;
create policy "Users can insert own ai insights"
  on public.notifications for insert to authenticated
  with check (auth.uid() = user_id and type = 'ai_insight');

-- =========================================================
-- REALTIME
-- =========================================================
alter table public.messages replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;