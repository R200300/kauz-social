import { supabase } from "@/integrations/supabase/client";

export interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at?: string;
}

export interface FollowUser {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  isFollowing: boolean;
}

export interface Highlight {
  id: string;
  user_id: string;
  title: string;
  cover_url: string | null;
  created_at: string;
}

export interface HighlightItem {
  id: string;
  highlight_id: string;
  media_url: string;
  position: number;
}

const PROFILE_COLS =
  "id, username, full_name, bio, avatar_url, website, followers_count, following_count, posts_count, created_at";

export async function fetchProfileById(id: string): Promise<ProfileRow | null> {
  const { data } = await supabase.from("profiles").select(PROFILE_COLS).eq("id", id).maybeSingle();
  return (data as ProfileRow) ?? null;
}

export async function fetchProfileByUsername(username: string): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("username", username)
    .maybeSingle();
  return (data as ProfileRow) ?? null;
}

export interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
}

/**
 * Compute authoritative profile stats directly from the source tables, so the
 * displayed numbers are always accurate even if the cached count columns on the
 * profiles row are stale or zero.
 */
export async function fetchProfileStats(profileId: string): Promise<ProfileStats> {
  const [posts, followers, following] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", profileId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profileId),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", profileId),
  ]);
  return {
    posts_count: posts.count ?? 0,
    followers_count: followers.count ?? 0,
    following_count: following.count ?? 0,
  };
}

export interface UpdateProfileInput {
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  website?: string | null;
  avatar_url?: string | null;
}

export async function updateProfile(id: string, fields: UpdateProfileInput): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", id)
    .select(PROFILE_COLS)
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

/** Upload an avatar image to the public "avatars" bucket and return its URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  return publicUrl;
}

// =========================================================
// FOLLOW / UNFOLLOW
// =========================================================
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (followerId === followingId) return false;
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== "23505") throw error; // ignore duplicate
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

type FollowJoinRow = {
  profile: FollowUser | FollowUser[] | null;
};

async function attachFollowState(
  users: Array<Omit<FollowUser, "isFollowing">>,
  currentUserId: string | null,
): Promise<FollowUser[]> {
  if (!currentUserId || users.length === 0) {
    return users.map((u) => ({ ...u, isFollowing: false }));
  }
  const ids = users.map((u) => u.id);
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId)
    .in("following_id", ids);
  const set = new Set((data ?? []).map((f) => f.following_id));
  return users.map((u) => ({ ...u, isFollowing: set.has(u.id) }));
}

/** People who follow `profileId`. */
export async function fetchFollowers(
  profileId: string,
  currentUserId: string | null,
): Promise<FollowUser[]> {
  const { data } = await supabase
    .from("follows")
    .select("profile:profiles!follows_follower_id_fkey(id, username, full_name, avatar_url)")
    .eq("following_id", profileId)
    .order("created_at", { ascending: false });
  const users = ((data ?? []) as FollowJoinRow[])
    .map((r) => (Array.isArray(r.profile) ? r.profile[0] : r.profile))
    .filter(Boolean) as Array<Omit<FollowUser, "isFollowing">>;
  return attachFollowState(users, currentUserId);
}

/** People `profileId` follows. */
export async function fetchFollowing(
  profileId: string,
  currentUserId: string | null,
): Promise<FollowUser[]> {
  const { data } = await supabase
    .from("follows")
    .select("profile:profiles!follows_following_id_fkey(id, username, full_name, avatar_url)")
    .eq("follower_id", profileId)
    .order("created_at", { ascending: false });
  const users = ((data ?? []) as FollowJoinRow[])
    .map((r) => (Array.isArray(r.profile) ? r.profile[0] : r.profile))
    .filter(Boolean) as Array<Omit<FollowUser, "isFollowing">>;
  return attachFollowState(users, currentUserId);
}

// =========================================================
// STORY HIGHLIGHTS
// =========================================================
export async function fetchHighlights(userId: string): Promise<Highlight[]> {
  const { data } = await supabase
    .from("story_highlights")
    .select("id, user_id, title, cover_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Highlight[];
}

export async function fetchHighlightItems(highlightId: string): Promise<HighlightItem[]> {
  const { data } = await supabase
    .from("highlight_items")
    .select("id, highlight_id, media_url, position")
    .eq("highlight_id", highlightId)
    .order("position", { ascending: true });
  return (data ?? []) as HighlightItem[];
}

/** Stories belonging to the user (active or expired) — candidates for a highlight. */
export async function fetchOwnStories(userId: string) {
  const { data } = await supabase
    .from("stories")
    .select("id, media_url, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Array<{ id: string; media_url: string; created_at: string }>;
}

/** Create a highlight from a set of story media URLs. */
export async function createHighlight(
  userId: string,
  title: string,
  mediaUrls: string[],
): Promise<Highlight> {
  const { data: highlight, error } = await supabase
    .from("story_highlights")
    .insert({ user_id: userId, title: title.trim() || "Highlight", cover_url: mediaUrls[0] ?? null })
    .select("id, user_id, title, cover_url, created_at")
    .single();
  if (error) throw error;

  if (mediaUrls.length > 0) {
    const items = mediaUrls.map((media_url, i) => ({
      highlight_id: highlight.id,
      user_id: userId,
      media_url,
      position: i,
    }));
    const { error: itemErr } = await supabase.from("highlight_items").insert(items);
    if (itemErr) throw itemErr;
  }
  return highlight as Highlight;
}

export async function deleteHighlight(id: string): Promise<void> {
  const { error } = await supabase.from("story_highlights").delete().eq("id", id);
  if (error) throw error;
}
