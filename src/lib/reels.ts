import { supabase } from "@/integrations/supabase/client";

export interface ReelAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface DbReel {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  author: ReelAuthor | null;
  liked: boolean;
  saved: boolean;
}

const REEL_SELECT =
  "id, user_id, caption, image_url, video_url, likes_count, comments_count, shares_count, views_count, created_at, author:profiles!posts_user_id_fkey(id, username, full_name, avatar_url)";

type RawReel = Omit<DbReel, "liked" | "saved" | "author"> & {
  author: ReelAuthor | ReelAuthor[] | null;
};

function normalize(row: RawReel): Omit<DbReel, "liked" | "saved"> {
  const author = Array.isArray(row.author) ? (row.author[0] ?? null) : row.author;
  return { ...row, author };
}

/** Fetch all reels (posts where is_reel = true), newest first, with like/save state. */
export async function fetchReels(userId: string | null): Promise<DbReel[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(REEL_SELECT)
    .eq("is_reel", true)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []).map((r) => normalize(r as RawReel));
  if (!userId || rows.length === 0) {
    return rows.map((r) => ({ ...r, liked: false, saved: false }));
  }

  const ids = rows.map((r) => r.id);
  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", ids),
    supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", ids),
  ]);
  const likedSet = new Set((likes ?? []).map((l) => l.post_id));
  const savedSet = new Set((saves ?? []).map((s) => s.post_id));
  return rows.map((r) => ({ ...r, liked: likedSet.has(r.id), saved: savedSet.has(r.id) }));
}

/** Like / unlike a reel. The likes_count trigger keeps posts.likes_count in sync. */
export async function toggleReelLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

/** Save / unsave a reel into the user's bookmarks. */
export async function toggleReelSave(postId: string, userId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

/** Bump views_count (called once a reel has played for >3s). */
export async function incrementReelViews(postId: string): Promise<void> {
  await supabase.rpc("increment_post_views", { p_post_id: postId });
}

/** Bump shares_count (called when the share sheet is opened). */
export async function incrementReelShares(postId: string): Promise<void> {
  await supabase.rpc("increment_post_shares", { p_post_id: postId });
}
