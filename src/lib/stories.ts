import { supabase } from "@/integrations/supabase/client";

export interface StoryAuthor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface StoryRow {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  text_overlay: string | null;
  views_count: number;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  author: StoryAuthor;
  stories: StoryRow[];
  allSeen: boolean;
}

export interface StoryViewer {
  viewer_id: string;
  created_at: string;
  profile: StoryAuthor | null;
}

const STORY_COLS =
  "id, user_id, media_url, media_type, text_overlay, views_count, created_at, expires_at, author:profiles!stories_user_id_fkey(id, username, full_name, avatar_url)";

type RawStory = Omit<StoryRow, never> & {
  author: StoryAuthor | StoryAuthor[] | null;
};

/**
 * Build the story tray: active (non-expired) stories from people the user
 * follows + their own, grouped per author, ordered own → unseen → seen.
 */
export async function fetchStoryTray(userId: string): Promise<StoryGroup[]> {
  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  const authorIds = [...(follows ?? []).map((f) => f.following_id), userId];

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_COLS)
    .in("user_id", authorIds)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as RawStory[];
  if (rows.length === 0) return [];

  // Which of these stories has the current user already seen?
  const storyIds = rows.map((r) => r.id);
  const { data: seenRows } = await supabase
    .from("story_views")
    .select("story_id")
    .eq("viewer_id", userId)
    .in("story_id", storyIds);
  const seenSet = new Set((seenRows ?? []).map((s) => s.story_id));

  const groups = new Map<string, StoryGroup>();
  for (const r of rows) {
    const author = (Array.isArray(r.author) ? r.author[0] : r.author) ?? {
      id: r.user_id,
      username: null,
      full_name: null,
      avatar_url: null,
    };
    const story: StoryRow = {
      id: r.id,
      user_id: r.user_id,
      media_url: r.media_url,
      media_type: r.media_type,
      text_overlay: r.text_overlay,
      views_count: r.views_count,
      created_at: r.created_at,
      expires_at: r.expires_at,
    };
    const existing = groups.get(r.user_id);
    if (existing) {
      existing.stories.push(story);
      if (!seenSet.has(story.id)) existing.allSeen = false;
    } else {
      groups.set(r.user_id, {
        author,
        stories: [story],
        allSeen: seenSet.has(story.id),
      });
    }
  }

  const list = [...groups.values()];
  return list.sort((a, b) => {
    // own group first
    if (a.author.id === userId) return -1;
    if (b.author.id === userId) return 1;
    // then unseen before seen
    if (a.allSeen !== b.allSeen) return a.allSeen ? 1 : -1;
    return 0;
  });
}

/** Record that the current user viewed a story (idempotent; trigger bumps count). */
export async function markStorySeen(storyId: string, viewerId: string): Promise<void> {
  await supabase
    .from("story_views")
    .upsert({ story_id: storyId, viewer_id: viewerId }, { onConflict: "story_id,viewer_id", ignoreDuplicates: true });
}

/** Viewers of one of your own stories (most recent first). */
export async function fetchStoryViewers(storyId: string): Promise<StoryViewer[]> {
  const { data } = await supabase
    .from("story_views")
    .select("viewer_id, created_at, profile:profiles!story_views_viewer_id_fkey(id, username, full_name, avatar_url)")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Array<{ viewer_id: string; created_at: string; profile: StoryAuthor | StoryAuthor[] | null }>).map(
    (r) => ({
      viewer_id: r.viewer_id,
      created_at: r.created_at,
      profile: Array.isArray(r.profile) ? (r.profile[0] ?? null) : r.profile,
    }),
  );
}

/** Upload a photo/video to the "stories" bucket and create a 24h story. */
export async function createStory(
  userId: string,
  file: File,
  textOverlay?: string,
): Promise<void> {
  const isVideo = file.type.startsWith("video/");
  const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage.from("stories").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw upErr;

  const {
    data: { publicUrl },
  } = supabase.storage.from("stories").getPublicUrl(path);

  const { error } = await supabase.from("stories").insert({
    user_id: userId,
    media_url: publicUrl,
    media_type: isVideo ? "video" : "image",
    text_overlay: textOverlay?.trim() || null,
  });
  if (error) throw error;
}
