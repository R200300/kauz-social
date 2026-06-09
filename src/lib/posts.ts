import { supabase } from "@/integrations/supabase/client";

export type DbPost = {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked: boolean;
  saved: boolean;
  author?: { username: string; avatar_url: string; full_name: string } | null;
};

export type DbComment = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  author?: { username: string; avatar_url: string } | null;
};

export async function fetchFeedPosts(userId?: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author: profiles(username, avatar_url, full_name)`)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data || [];
}

export async function fetchExplorePosts(userId?: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author: profiles(username, avatar_url, full_name)`)
    .order("likes_count", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function fetchExploreUsers(userId?: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function fetchUserPosts(profileId: string, userId?: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author: profiles(username, avatar_url, full_name)`)
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchSavedPosts(userId: string): Promise<DbPost[]> {
  const { data, error } = await supabase
    .from("saved_posts")
    .select(`post: posts(*, author: profiles(username, avatar_url, full_name))`)
    .eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((row: any) => row.post);
}

export async function toggleLike(postId: string, userId: string, remove: boolean) {
  if (remove) {
    return supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    return supabase.from("likes").insert({ post_id: postId, user_id: userId });
  }
}

export async function toggleSave(postId: string, userId: string, remove: boolean) {
  if (remove) {
    return supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
  } else {
    return supabase
      .from("saved_posts")
      .insert({ post_id: postId, user_id: userId });
  }
}

export async function deletePost(post: DbPost) {
  return supabase.from("posts").delete().eq("id", post.id);
}

export async function fetchComments(postId: string): Promise<DbComment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(`*, author: profiles(username, avatar_url)`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(postId: string, userId: string, text: string) {
  return supabase
    .from("comments")
    .insert({ post_id: postId, user_id: userId, text })
    .single();
}
