import { supabase } from "@/integrations/supabase/client";

export const PAGE_SIZE = 10;

export interface PostAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface DbPost {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author: PostAuthor | null;
  liked: boolean;
  saved: boolean;
}

export interface DbComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: PostAuthor | null;
}

const POST_SELECT =
  "id, user_id, caption, image_url, likes_count, comments_count, created_at, author:profiles!posts_user_id_fkey(id, username, full_name, avatar_url)";

const COMMENT_SELECT =
  "id, post_id, user_id, content, created_at, author:profiles!comments_user_id_fkey(id, username, full_name, avatar_url)";

type RawPost = Omit<DbPost, "liked" | "saved" | "author"> & {
  author: PostAuthor | PostAuthor[] | null;
};

function normalize(row: RawPost): Omit<DbPost, "liked" | "saved"> {
  const author = Array.isArray(row.author) ? (row.author[0] ?? null) : row.author;
  return { ...row, author };
}

async function enrich(
  rows: Array<Omit<DbPost, "liked" | "saved">>,
  userId: string | null,
): Promise<DbPost[]> {
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

export async function fetchFollowingFeed(userId: string, page: number): Promise<DbPost[]> {
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  const authorIds = [...(follows ?? []).map((f) => f.following_id), userId];

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("user_id", authorIds)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return enrich((data ?? []).map((r) => normalize(r as RawPost)), userId);
}

export async function fetchExploreFeed(userId: string | null, page: number): Promise<DbPost[]> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("likes_count", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return enrich((data ?? []).map((r) => normalize(r as RawPost)), userId);
}

export async function fetchPostById(id: string, userId: string | null): Promise<DbPost | null> {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  const [post] = await enrich([normalize(data as RawPost)], userId);
  return post;
}

export async function fetchUserPosts(profileId: string, userId: string | null): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return enrich((data ?? []).map((r) => normalize(r as RawPost)), userId);
}

export async function fetchSavedPosts(userId: string): Promise<DbPost[]> {
  const { data: saved } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const ids = (saved ?? []).map((s) => s.post_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("posts").select(POST_SELECT).in("id", ids);
  if (error) throw error;
  const rows = (data ?? []).map((r) => normalize(r as RawPost));
  rows.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return enrich(rows, userId);
}

export async function toggleLike(postId: string, userId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function toggleSave(postId: string, userId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("saved_posts").insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }
}

export async function fetchComments(postId: string): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => {
    const author = Array.isArray(c.author) ? (c.author[0] ?? null) : c.author;
    return { ...c, author } as DbComment;
  });
}

export async function addComment(postId: string, userId: string, content: string): Promise<void> {
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: userId,
    content: content.trim(),
  });
  if (error) throw error;
}

export async function createPost(userId: string, file: File, caption: string): Promise<DbPost> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage.from("posts").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: userId, caption: caption.trim() || null, image_url: publicUrl })
    .select(POST_SELECT)
    .single();
  if (error) throw error;
  const [post] = await enrich([normalize(data as RawPost)], userId);
  return post;
}

export async function deletePost(post: DbPost): Promise<void> {
  if (post.image_url) {
    const marker = "/posts/";
    const idx = post.image_url.indexOf(marker);
    if (idx >= 0) {
      const storagePath = post.image_url.slice(idx + marker.length);
      await supabase.storage.from("posts").remove([storagePath]);
    }
  }
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) throw error;
}