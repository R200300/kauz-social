-- Kauz social media schema
-- Paste this entire file into Supabase SQL Editor and run it.

-- =========================================================
-- PROFILES
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  followers_count int not null default 0,
  following_count int not null default 0,
  posts_count int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users can delete own profile"
  on public.profiles for delete to authenticated using (auth.uid() = id);

-- =========================================================
-- POSTS
-- =========================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  image_url text,
  video_url text,
  likes_count int not null default 0,
  comments_count int not null default 0,
  is_reel boolean not null default false,
  ai_generated_caption boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);
create policy "Users can create own posts"
  on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own posts"
  on public.posts for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own posts"
  on public.posts for delete to authenticated using (auth.uid() = user_id);

-- =========================================================
-- LIKES
-- =========================================================
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
create index if not exists likes_post_id_idx on public.likes(post_id);

grant select on public.likes to anon;
grant select, insert, delete on public.likes to authenticated;
grant all on public.likes to service_role;

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select using (true);
create policy "Users can like as themselves"
  on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can unlike own likes"
  on public.likes for delete to authenticated using (auth.uid() = user_id);

-- =========================================================
-- COMMENTS
-- =========================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_id_idx on public.comments(post_id);

grant select on public.comments to anon;
grant select, insert, update, delete on public.comments to authenticated;
grant all on public.comments to service_role;

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select using (true);
create policy "Users can comment as themselves"
  on public.comments for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own comments"
  on public.comments for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own comments"
  on public.comments for delete to authenticated using (auth.uid() = user_id);

-- =========================================================
-- FOLLOWS
-- =========================================================
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_following_idx on public.follows(following_id);

grant select on public.follows to anon;
grant select, insert, delete on public.follows to authenticated;
grant all on public.follows to service_role;

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select using (true);
create policy "Users can follow as themselves"
  on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "Users can unfollow own follows"
  on public.follows for delete to authenticated using (auth.uid() = follower_id);

-- =========================================================
-- STORIES (auto-expire 24h)
-- =========================================================
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  views_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists stories_user_idx on public.stories(user_id);
create index if not exists stories_expires_idx on public.stories(expires_at);

grant select on public.stories to anon;
grant select, insert, update, delete on public.stories to authenticated;
grant all on public.stories to service_role;

alter table public.stories enable row level security;

create policy "Active stories viewable by everyone"
  on public.stories for select using (expires_at > now());
create policy "Users can create own stories"
  on public.stories for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own stories"
  on public.stories for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own stories"
  on public.stories for delete to authenticated using (auth.uid() = user_id);

-- =========================================================
-- MESSAGES
-- =========================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists messages_receiver_idx on public.messages(receiver_id);

grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;

alter table public.messages enable row level security;

create policy "Users can view messages they sent or received"
  on public.messages for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages as themselves"
  on public.messages for insert to authenticated
  with check (auth.uid() = sender_id);
create policy "Receivers can mark messages read"
  on public.messages for update to authenticated
  using (auth.uid() = receiver_id);
create policy "Senders can delete own messages"
  on public.messages for delete to authenticated
  using (auth.uid() = sender_id);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('like','comment','follow','ai_insight')),
  post_id uuid references public.posts(id) on delete cascade,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id);
create policy "Users can delete own notifications"
  on public.notifications for delete to authenticated
  using (auth.uid() = user_id);

-- =========================================================
-- SAVED POSTS
-- =========================================================
create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);
create index if not exists saved_posts_user_idx on public.saved_posts(user_id);

grant select, insert, delete on public.saved_posts to authenticated;
grant all on public.saved_posts to service_role;

alter table public.saved_posts enable row level security;

create policy "Users can view own saves"
  on public.saved_posts for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can save as themselves"
  on public.saved_posts for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can unsave own saves"
  on public.saved_posts for delete to authenticated
  using (auth.uid() = user_id);

-- =========================================================
-- Auto-create profile on signup
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
