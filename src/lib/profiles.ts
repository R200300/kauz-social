import { supabase } from "@/integrations/supabase/client";

export type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  posts_count?: number;
  followers_count?: number;
  following_count?: number;
};

export type FollowUser = ProfileRow & { isFollowing: boolean };

export async function fetchProfileById(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function fetchProfileStats(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `posts_count: posts(count), followers_count: followers(count), following_count: following(count)`,
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function isFollowing(userId: string, targetId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", userId)
    .eq("following_id", targetId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

export async function followUser(userId: string, targetId: string) {
  return supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
}

export async function unfollowUser(userId: string, targetId: string) {
  return supabase
    .from("follows")
    .delete()
    .eq("follower_id", userId)
    .eq("following_id", targetId);
}

export async function fetchFollowers(userId: string, currentUserId?: string): Promise<FollowUser[]> {
  const { data, error } = await supabase
    .from("follows")
    .select(`follower: profiles(*)`)
    .eq("following_id", userId);
  if (error) throw error;
  const users = (data || []).map((row: any) => row.follower) as ProfileRow[];
  if (!currentUserId) return users.map((u) => ({ ...u, isFollowing: false }));
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);
  const followingIds = new Set((following || []).map((f: any) => f.following_id));
  return users.map((u) => ({ ...u, isFollowing: followingIds.has(u.id) }));
}

export async function fetchFollowing(
  userId: string,
  currentUserId?: string,
): Promise<FollowUser[]> {
  const { data, error } = await supabase
    .from("follows")
    .select(`following: profiles(*)`)
    .eq("follower_id", userId);
  if (error) throw error;
  const users = (data || []).map((row: any) => row.following) as ProfileRow[];
  if (!currentUserId) return users.map((u) => ({ ...u, isFollowing: false }));
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);
  const followingIds = new Set((following || []).map((f: any) => f.following_id));
  return users.map((u) => ({ ...u, isFollowing: followingIds.has(u.id) }));
}

export type Highlight = {
  id: string;
  user_id: string;
  title: string;
  cover_url?: string;
};

export type HighlightItem = {
  id: string;
  highlight_id: string;
  media_url: string;
};

export async function fetchHighlights(userId: string): Promise<Highlight[]> {
  const { data, error } = await supabase
    .from("highlights")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data || [];
}

export async function fetchHighlightItems(highlightId: string): Promise<HighlightItem[]> {
  const { data, error } = await supabase
    .from("highlight_items")
    .select("*")
    .eq("highlight_id", highlightId);
  if (error) throw error;
  return data || [];
}

export async function fetchOwnStories(userId: string) {
  const { data, error } = await supabase
    .from("stories")
    .select("id, image_url: media_url")
    .eq("user_id", userId);
  if (error) throw error;
  return data || [];
}

export async function createHighlight(userId: string, title: string, mediaUrls: string[]) {
  const { data: hl, error: hlErr } = await supabase
    .from("highlights")
    .insert({ user_id: userId, title, cover_url: mediaUrls[0] })
    .select()
    .single();
  if (hlErr) throw hlErr;
  const items = mediaUrls.map((url) => ({ highlight_id: hl.id, media_url: url }));
  const { error: itemErr } = await supabase.from("highlight_items").insert(items);
  if (itemErr) throw itemErr;
}

export async function deleteHighlight(highlightId: string) {
  return supabase.from("highlights").delete().eq("id", highlightId);
}
