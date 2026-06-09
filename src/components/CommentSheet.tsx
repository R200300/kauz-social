import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchComments,
  addComment,
  type DbComment,
} from "@/lib/posts";
import { Spinner } from "@/components/Spinner";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function CommentSheet({
  postId,
  userId,
  open,
  onClose,
  onCommentAdded,
}: {
  postId: string;
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}) {
  const [comments, setComments] = useState<DbComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetchComments(postId)
      .then((rows) => {
        if (active) setComments(rows);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        async () => {
          // refetch to resolve author info for the realtime row
          const rows = await fetchComments(postId);
          if (active) setComments(rows);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [open, postId]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  async function submit() {
    const value = text.trim();
    if (!value || !userId || sending) return;
    setSending(true);
    setText("");
    try {
      await addComment(postId, userId, value);
      onCommentAdded?.();
      const rows = await fetchComments(postId);
      setComments(rows);
    } catch {
      setText(value);
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[75svh] w-full max-w-md flex-col rounded-t-3xl border border-primary/20 bg-card shadow-glow animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="font-display text-base font-semibold">Comments</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="grid place-items-center py-10">
              <Spinner size={28} />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No comments yet. Be the first ✨</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <img
                  src={c.author?.avatar_url ?? `https://i.pravatar.cc/100?u=${c.user_id}`}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full ring-1 ring-primary/40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">@{c.author?.username ?? "user"}</span>{" "}
                    <span className="text-muted-foreground">{timeAgo(c.created_at)}</span>
                  </p>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={listEnd} />
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={userId ? "Add a comment…" : "Log in to comment"}
            disabled={!userId || sending}
            className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={!text.trim() || sending || !userId}
            className="tap-pulse grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow-sm disabled:opacity-50"
            aria-label="Send"
          >
            {sending ? <Spinner size={16} /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
