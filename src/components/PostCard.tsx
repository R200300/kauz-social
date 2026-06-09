import { Heart, MessageCircle, Send, Bookmark, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import {
  toggleLike,
  toggleSave,
  deletePost,
  type DbPost,
} from "@/lib/posts";
import { CommentSheet } from "@/components/CommentSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Caption({ text }: { text: string }) {
  const parts = text.split(/(#\w+)/g);
  return (
    <p className="text-sm leading-relaxed">
      {parts.map((p, i) =>
        p.startsWith("#") ? (
          <span key={i} className="text-primary">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

export function PostCard({
  post,
  userId,
  onDeleted,
}: {
  post: DbPost;
  userId: string | null;
  onDeleted?: (id: string) => void;
}) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes_count);
  const [burstKey, setBurstKey] = useState(0);
  const [saved, setSaved] = useState(post.saved);
  const [comments, setComments] = useState(post.comments_count);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwner = !!userId && userId === post.user_id;
  // AI feed tag: hot post (100+ likes within the first hour).
  const trending =
    post.likes_count > 100 && Date.now() - new Date(post.created_at).getTime() < 3_600_000;
  const author = post.author;
  const handle = author?.username ?? "user";
  const name = author?.full_name ?? handle;
  const avatar = author?.avatar_url ?? `https://i.pravatar.cc/200?u=${post.user_id}`;

  async function onLike() {
    if (!userId) return;
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    if (next) setBurstKey((k) => k + 1);
    try {
      await toggleLike(post.id, userId, !next);
    } catch {
      // revert on failure
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    }
  }

  async function onSave() {
    if (!userId) return;
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, userId, !next);
    } catch {
      setSaved(!next);
    }
  }

  function startPress() {
    if (!isOwner) return;
    pressTimer.current = setTimeout(() => setConfirmOpen(true), 550);
  }
  function endPress() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deletePost(post);
      onDeleted?.(post.id);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-border/60 bg-card animate-page-fade">
      <header className="flex items-center gap-3 p-3">
        <Link to={`/u/${handle}`} className="flex min-w-0 flex-1 items-center gap-3">
          <img src={avatar} alt={name} className="h-10 w-10 rounded-full ring-2 ring-primary/60 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-muted-foreground">@{handle} - {timeAgo(post.created_at)}</p>
          </div>
        </Link>
        {isOwner && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground tap-pulse"
            aria-label="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>

      {post.image_url && (
        <div
          className="relative select-none"
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
        >
          <img
            src={post.image_url}
            alt=""
            className="aspect-square w-full object-cover"
            onDoubleClick={onLike}
            loading="lazy"
          />
          {trending && (
            <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-bold text-primary shadow-glow-sm backdrop-blur">
              🔥 Trending
            </span>
          )}
        </div>
      )}

      <div className="space-y-2 p-3">
        <div className="flex items-center gap-1 text-foreground">
          <button onClick={onLike} disabled={!userId} className="tap-pulse relative flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-surface disabled:opacity-60" aria-label="Like">
            <span className="relative inline-grid place-items-center">
              <Heart
                key={burstKey}
                className={`h-6 w-6 transition-colors ${liked ? "fill-[oklch(0.65_0.24_25)] text-[oklch(0.65_0.24_25)] animate-heart-burst" : ""}`}
                strokeWidth={1.8}
              />
              {liked && (
                <span
                  key={`r-${burstKey}`}
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-[oklch(0.65_0.24_25)] animate-heart-rings"
                />
              )}
            </span>
            <span className="text-xs font-medium">{fmt(likes)}</span>
          </button>
          <button onClick={() => setCommentsOpen(true)} className="tap-pulse flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-surface" aria-label="Comment">
            <MessageCircle className="h-6 w-6" strokeWidth={1.8} />
            <span className="text-xs font-medium">{fmt(comments)}</span>
          </button>
          <button className="tap-pulse flex items-center gap-1.5 rounded-full px-2 py-1.5 hover:bg-surface" aria-label="Share">
            <Send className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <button onClick={onSave} disabled={!userId} className="tap-pulse ml-auto grid h-9 w-9 place-items-center rounded-full hover:bg-surface disabled:opacity-60" aria-label="Save">
            <Bookmark className={`h-6 w-6 transition-transform ${saved ? "fill-primary text-primary scale-110" : ""}`} strokeWidth={1.8} />
          </button>
        </div>
        {post.caption && <Caption text={post.caption} />}
        {comments > 0 && (
          <button onClick={() => setCommentsOpen(true)} className="text-xs text-muted-foreground hover:text-foreground">
            View all {comments} comments
          </button>
        )}
      </div>

      <CommentSheet
        postId={post.id}
        userId={userId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommentAdded={() => setComments((c) => c + 1)}
      />

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !deleting && setConfirmOpen(o)}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the post and its image. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="rounded-full bg-[oklch(0.55_0.22_25)] text-white hover:bg-[oklch(0.5_0.22_25)]"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}