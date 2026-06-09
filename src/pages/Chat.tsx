import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Video, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  fetchChatPartner,
  fetchMessages,
  sendMessage,
  markConversationRead,
  isOnline,
  type ChatUser,
  type DbMessage,
} from "@/lib/messages";
import { Spinner } from "@/components/Spinner";

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat() {
  const { id: partnerId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [partner, setPartner] = useState<ChatUser | null>(null);
  const [msgs, setMsgs] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  useEffect(() => {
    if (!userId || !partnerId) return;
    let active = true;
    setLoading(true);
    Promise.all([fetchChatPartner(partnerId), fetchMessages(userId, partnerId)])
      .then(([p, m]) => {
        if (!active) return;
        setPartner(p);
        setMsgs(m);
        scrollToBottom();
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    markConversationRead(userId, partnerId).catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, partnerId]);

  // Realtime: listen to any new message in this thread.
  useEffect(() => {
    if (!userId || !partnerId) return;
    const channel = supabase
      .channel(`chat:${userId}:${partnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as DbMessage;
          const inThread =
            (m.sender_id === userId && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === userId);
          if (!inThread) return;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          scrollToBottom();
          if (m.sender_id === partnerId) markConversationRead(userId, partnerId).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, partnerId]);

  async function send() {
    const body = text.trim();
    if (!body || !userId || !partnerId || sending) return;
    setText("");
    setSending(true);
    try {
      const m = await sendMessage(userId, partnerId, body);
      setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      scrollToBottom();
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  }

  const name = partner?.full_name ?? partner?.username ?? "Chat";
  const avatar = partner?.avatar_url ?? `https://i.pravatar.cc/200?u=${partnerId}`;
  const online = isOnline(partner?.last_seen ?? null);

  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-xl">
        <Link to="/messages" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link to={`/u/${partner?.username ?? ""}`} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative">
            <img src={avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-[11px] text-muted-foreground">{online ? "Online" : "Offline"}</p>
          </div>
        </Link>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"><Phone className="h-5 w-5" /></button>
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"><Video className="h-5 w-5" /></button>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="grid place-items-center py-20">
            <Spinner size={28} />
          </div>
        ) : msgs.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Say hi 👋</p>
        ) : (
          msgs.map((m) => {
            const mine = m.sender_id === userId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-gradient-primary text-primary-foreground rounded-br-md shadow-glow-sm"
                      : "bg-surface-elevated rounded-bl-md"
                  }`}
                >
                  {m.content}
                  <div className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {clock(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="sticky bottom-0 border-t border-border/60 bg-background/90 px-3 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 focus-within:border-primary">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow-sm disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
