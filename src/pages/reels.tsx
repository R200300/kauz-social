import { Heart, MessageCircle, Send, Bookmark, Music, Search, ArrowLeft, Play, Eye, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchReels,
  toggleReelLike,
  toggleReelSave,
  incrementReelViews,
  incrementReelShares,
  type DbReel,
} from "@/lib/reels";
import { CommentSheet } from "@/components/CommentSheet";
import { Spinner } from "@/components/Spinner";


function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return String(n);
}

function Reel({
  r,
  active,
  userId,
  muted,
  onLikeChange,
  onSaveChange,
  onCommentAdded,
  onViewed,
  onToggleMute,
}: {
  r: DbReel;
  active: boolean;
  userId: string | null;
  muted: boolean;
  onLikeChange: (id: string, liked: boolean) => void;
  onSaveChange: (id: string, saved: boolean) => void;
  onCommentAdded: (id: string) => void;
  onViewed: (id: string) => void;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counted = useRef(false);

  // Sync muted state with video element
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) vid.muted = muted;
  }, [muted]);

  // Auto-play when in view, pause when scrolled away. Count a view after 3s.
  useEffect(() => {
    const vid = videoRef.current;
    if (active) {
      vid?.play().catch(() => {});
      viewTimer.current = setTimeout(() => {
        if (!counted.current) {
          counted.current = true;
          onViewed(r.id);
        }
      }, 3000);
    } else {
      vid?.pause();
      if (viewTimer.current) clearTimeout(viewTimer.current);
    }
    return () => {
      if (viewTimer.current) clearTimeout(viewTimer.current);
    };
  }, [active, r.id, onViewed]);

  function like() {
    if (!userId) return;
    const next = !r.liked;
    if (next) setBurstKey((k) => k + 1);
    onLikeChange(r.id, next);
    toggleReelLike(r.id, userId, !next).catch(() => onLikeChange(r.id, !next));
  }

  function save() {
    if (!userId) return;
    const next = !r.saved;
    onSaveChange(r.id, next);
    toggleReelSave(r.id, userId, !next).catch(() => onSaveChange(r.id, !next));
  }

  async function share() {
    const url = `${window.location.origin}/reels`;
    const text = r.caption ?? "Check out this reel on Kauz";
    incrementReelShares(r.id).catch(() => {});
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kauz", text, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled */
    }
  }

  const author = r.author;
  const handle = author?.username ?? "user";
  const avatar = author?.avatar_url ?? `https://i.pravatar.cc/200?u=${r.user_id}`;
  const RED = "oklch(0.65 0.24 25)";

  return (
    <section className="relative h-[100svh] w-full snap-start overflow-hidden bg-black">
      {r.video_url ? (
        <video
          ref={videoRef}
          src={r.video_url}
          poster={r.image_url ?? undefined}
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted={muted}
          playsInline
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            v.paused ? v.play().catch(() => {}) : v.pause();
          }}
        />
      ) : (
        <img src={r.image_url ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover" onDoubleClick={like} />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(max(env(safe-area-inset-top),0.75rem)+0.5rem)]">
        <Link to="/feed" aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <h1 className="font-display text-base font-semibold text-white">Reels</h1>
        <button className="grid h-9 w-9 place-items-center rounded-full bg-black/40 backdrop-blur" aria-label="Search">
          <Search className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* side actions */}
      <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-5 text-white">
        <button onClick={like} disabled={!userId} className="flex flex-col items-center gap-1 disabled:opacity-60">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
            <Heart
              key={burstKey}
              className={`h-6 w-6 transition-colors ${r.liked ? "animate-heart-burst" : ""}`}
              style={r.liked ? { fill: RED, color: RED } : undefined}
            />
          </span>
          <span className="text-[11px] font-medium">{fmt(r.likes_count)}</span>
        </button>
        <button onClick={() => setCommentsOpen(true)} className="flex flex-col items-center gap-1">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
            <MessageCircle className="h-6 w-6" />
          </span>
          <span className="text-[11px] font-medium">{fmt(r.comments_count)}</span>
        </button>
        <button onClick={share} className="flex flex-col items-center gap-1">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
            <Send className="h-6 w-6" />
          </span>
          <span className="text-[11px] font-medium">{fmt(r.shares_count)}</span>
        </button>
        {r.video_url && (
          <button onClick={onToggleMute} className="flex flex-col items-center gap-1">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
              {muted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </span>
            <span className="text-[11px] font-medium">{muted ? "Muted" : "Sound"}</span>
          </button>
        )}
        <button onClick={save} disabled={!userId} className="flex flex-col items-center gap-1 disabled:opacity-60">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-black/40 backdrop-blur">
            <Bookmark className={`h-6 w-6 ${r.saved ? "fill-white" : ""}`} />
          </span>
          <span className="text-[11px] font-medium">Save</span>
        </button>
        <Link to={`/u/${handle}`} className="mt-2 block rounded-full bg-gradient-primary p-[2px] shadow-glow-sm">
          <img src={avatar} alt="" className="h-9 w-9 rounded-full border-2 border-black object-cover" />
        </Link>
      </div>

      {/* bottom info */}
      <div className="absolute inset-x-0 bottom-0 z-10 space-y-2 px-4 pb-8 pr-20 text-white">
        <Link to={`/u/${handle}`} className="flex items-center gap-2">
          <img src={avatar} alt="" className="h-8 w-8 rounded-full ring-2 ring-primary object-cover" />
          <span className="text-sm font-semibold">@{handle}</span>
        </Link>
        {r.caption && <p className="text-sm">{r.caption}</p>}
        <div className="flex items-center gap-3 text-xs text-white/80">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {fmt(r.views_count)} views
          </span>
          <span className="flex items-center gap-1">
            <Music className="h-3.5 w-3.5" /> Original audio
          </span>
        </div>
      </div>

      <CommentSheet
        postId={r.id}
        userId={userId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        onCommentAdded={() => onCommentAdded(r.id)}
      />
    </section>
  );
}

export default function Reels() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(() => {
    try {
      const stored = localStorage.getItem("kauz_reels_muted");
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchReels(userId)
      .then((rows) => {
        if (!active) return;
        setReels(rows);
        if (rows[0]) setActiveId(rows[0].id);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  // Persist mute preference across sessions.
  useEffect(() => {
    localStorage.setItem("kauz_reels_muted", JSON.stringify(muted));
  }, [muted]);

  // Realtime: keep counts (likes/comments/shares/views) in sync across users.
  useEffect(() => {
    const channel = supabase
      .channel("reels-counts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload) => {
          const row = payload.new as Partial<DbReel> & { id: string };
          setReels((list) =>
            list.map((r) =>
              r.id === row.id
                ? {
                    ...r,
                    likes_count: row.likes_count ?? r.likes_count,
                    comments_count: row.comments_count ?? r.comments_count,
                    shares_count: row.shares_count ?? r.shares_count,
                    views_count: row.views_count ?? r.views_count,
                  }
                : r,
            ),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Track which reel is on screen to drive autoplay + view counting.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            setActiveId((e.target as HTMLElement).dataset.id ?? null);
          }
        }
      },
      { root, threshold: [0.6] },
    );
    root.querySelectorAll("[data-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const onLikeChange = useCallback((id: string, liked: boolean) => {
    setReels((list) =>
      list.map((r) => (r.id === id ? { ...r, liked, likes_count: Math.max(0, r.likes_count + (liked ? 1 : -1)) } : r)),
    );
  }, []);

  const onSaveChange = useCallback((id: string, saved: boolean) => {
    setReels((list) => list.map((r) => (r.id === id ? { ...r, saved } : r)));
  }, []);

  const onCommentAdded = useCallback((id: string) => {
    setReels((list) => list.map((r) => (r.id === id ? { ...r, comments_count: r.comments_count + 1 } : r)));
  }, []);

  const onViewed = useCallback((id: string) => {
    setReels((list) => list.map((r) => (r.id === id ? { ...r, views_count: r.views_count + 1 } : r)));
    incrementReelViews(id).catch(() => {});
  }, []);

  const onToggleMute = useCallback(() => {
    setMuted((m: boolean) => !m);
  }, []);

  if (loading) {
    return (
      <div className="grid h-[100svh] place-items-center bg-black">
        <Spinner size={32} />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-[100svh] flex-col items-center justify-center gap-4 bg-black px-8 text-center text-white">
        <Play className="h-12 w-12 text-primary" />
        <p className="text-lg font-semibold">No reels yet</p>
        <p className="text-sm text-white/60">Create a post and mark it as a reel to see it here.</p>
        <Link to="/feed" className="mt-2 rounded-full bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-[100svh] snap-y snap-mandatory overflow-y-auto bg-black scrollbar-hide">
      {reels.map((r) => (
        <div key={r.id} data-id={r.id}>
          <Reel
            r={r}
            active={activeId === r.id}
            userId={userId}
            muted={muted}
            onLikeChange={onLikeChange}
            onSaveChange={onSaveChange}
            onCommentAdded={onCommentAdded}
            onViewed={onViewed}
            onToggleMute={onToggleMute}
          />
        </div>
      ))}
    </div>
  );
}