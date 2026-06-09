import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "like" | "comment" | "follow" | "ai_insight";

export interface NotificationActor {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export interface DbNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  post_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor: NotificationActor | null;
}

const SELECT =
  "id, user_id, actor_id, type, post_id, message, is_read, created_at, actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url)";

function normalize(row: { actor: NotificationActor | NotificationActor[] | null } & Record<string, unknown>): DbNotification {
  const actor = Array.isArray(row.actor) ? (row.actor[0] ?? null) : row.actor;
  return { ...(row as unknown as DbNotification), actor };
}

export async function fetchNotifications(userId: string): Promise<DbNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => normalize(r as never));
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

/** Insert an AI insight notification for the current user (self-insert policy). */
export async function insertAiInsight(userId: string, message: string): Promise<void> {
  await supabase
    .from("notifications")
    .insert({ user_id: userId, type: "ai_insight", message });
}

/** Subscribe to new notifications for the current user. */
export function subscribeToNotifications(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
