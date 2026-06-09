import { supabase } from "@/integrations/supabase/client";

export async function touchLastSeen(userId: string) {
  return supabase
    .from("profiles")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", userId);
}
