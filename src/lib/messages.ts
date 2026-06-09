import { supabase } from "@/integrations/supabase/client";

export interface ChatUser { id: string; username: string | null; full_name: string | null; avatar_url: string | null; last_seen: string | null; }
export interface DbMessage { id: string; sender_id: string; receiver_id: string; content: string; is_read: boolean; created_at: string; }
export interface Conversation { partner: ChatUser; lastMessage: DbMessage; unread: number; }

const USER_COLS = "id, username, full_name, avatar_url, last_seen";

export function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

export async function touchLastSeen(userId: string): Promise<void> {
  await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: rows, error } = await supabase.from("messages").select("id, sender_id, receiver_id, content, is_read, created_at").or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order("created_at", { ascending: false });
  if (error) throw error;

  const byPartner = new Map<string, { last: DbMessage; unread: number }>();
  for (const m of (rows ?? []) as DbMessage[]) {
    const partnerId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    const entry = byPartner.get(partnerId);
    const isUnread = m.receiver_id === userId && !m.is_read;
    if (!entry) { byPartner.set(partnerId, { last: m, unread: isUnread ? 1 : 0 }); }
    else if (isUnread) { entry.unread += 1; }
  }
  if (byPartner.size === 0) return [];

  const partnerIds = [...byPartner.keys()];
  const { data: profiles } = await supabase.from("profiles").select(USER_COLS).in("id", partnerIds);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as ChatUser]));

  return partnerIds.map((id) => {
    const e = byPartner.get(id)!;
    const partner = profileMap.get(id) ?? ({ id, username: null, full_name: null, avatar_url: null, last_seen: null } as ChatUser);
    return { partner, lastMessage: e.last, unread: e.unread };
  }).sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());
}

export async function fetchChatPartner(id: string): Promise<ChatUser | null> {
  const { data } = await supabase.from("profiles").select(USER_COLS).eq("id", id).maybeSingle();
  return (data as ChatUser) ?? null;
}

export async function fetchMessages(userId: string, partnerId: string): Promise<DbMessage[]> {
  const { data, error } = await supabase.from("messages").select("id, sender_id, receiver_id, content, is_read, created_at").or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`).order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbMessage[];
}

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<DbMessage> {
  const { data, error } = await supabase.from("messages").insert({ sender_id: senderId, receiver_id: receiverId, content: content.trim() }).select("id, sender_id, receiver_id, content, is_read, created_at").single();
  if (error) throw error;
  return data as DbMessage;
}

export async function markConversationRead(userId: string, partnerId: string): Promise<void> {
  await supabase.from("messages").update({ is_read: true }).eq("receiver_id", userId).eq("sender_id", partnerId).eq("is_read", false);
}

export async function searchUsers(query: string, excludeId: string): Promise<ChatUser[]> {
  const q = query.trim();
  if (!q) return [];
  const { data } = await supabase.from("profiles").select(USER_COLS).ilike("username", `%${q}%`).neq("id", excludeId).limit(15);
  return (data ?? []) as ChatUser[];
}

export function subscribeToMessages(userId: string, onMessage: (m: DbMessage) => void) {
  const channel = supabase.channel(`messages:${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${userId}` }, (payload) => onMessage(payload.new as DbMessage)).subscribe();
  return () => { supabase.removeChannel(channel); };
}