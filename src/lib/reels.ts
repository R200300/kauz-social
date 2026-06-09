import { supabase } from "@/integrations/supabase/client";

export type Reel = {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  created_at: string;
};

export async function fetchReels(): Promise<Reel[]> {
  const { data, error } = await supabase
    .from("reels")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}
