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
  }, [comments]);

  const handleSend = async () => {
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      await addComment(postId, userId, text);
      setText("");
      onCommentAdded?.();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 transition-all ${open ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Comments</h2>
          <button onClick={onClose} className="text-muted-foreground"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <img src={c.author?.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{c.author?.username}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</p>
                  </div>
                  <p className="text-sm text-foreground break-words">{c.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={listEnd} />
        </div>
        <div className="border-t p-4 flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none"
            disabled={sending}
          />
          <button onClick={handleSend} disabled={!text.trim() || sending} className="text-primary disabled:text-muted-foreground">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}