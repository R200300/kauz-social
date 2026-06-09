import { supabase } from "@/integrations/supabase/client";

export type Story = {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  user?: { username: string; avatar_url: string };
};

export async function fetchStories(currentUserId?: string): Promise<Story[]> {
  if (!currentUserId) return [];
  const { data, error } = await supabase
    .from("stories")
    .select(`*, user: profiles(username, avatar_url)`)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}
