import { useCallback, useEffect, useRef, useState } from "react";
import { X, Eye, ChevronUp } from "lucide-react";
import { markStorySeen, fetchStoryViewers, type StoryGroup, type StoryViewer as ViewerRow } from "@/lib/stories";

const DURATION = 5000; // ms per image story

export function StoryViewer({
  groups,
  startGroup,
  userId,
  onClose,
  onSeen,
}: {
  groups: StoryGroup[];
  startGroup: number;
  userId: string;
  onClose: () => void;
  onSeen: (storyId: string) => void;
}) {
  const [gi, setGi] = useState(startGroup);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  const group = groups[gi];
  const story = group?.stories[si];
  const isOwn = group?.author.id === userId;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const close = onClose;

  const goNext = useCallback(() => {
    setShowViewers(false);
    setProgress(0);
    if (si < group.stories.length - 1) {
      setSi(si + 1);
    } else if (gi < groups.length - 1) {
      setGi(gi + 1);
      setSi(0);
    } else {
      close();
    }
  }, [si, gi, group, groups.length, close]);

  const goPrev = useCallback(() => {
    setShowViewers(false);
    setProgress(0);
    if (si > 0) {
      setSi(si - 1);
    } else if (gi > 0) {
      const prevGroup = groups[gi - 1];
      setGi(gi - 1);
      setSi(prevGroup.stories.length - 1);
    } else {
      setProgress(0);
    }
  }, [si, gi, groups]);

  // mark current story as seen
  useEffect(() => {
    if (!story) return;
    markStorySeen(story.id, userId).catch(() => {});
    onSeen(story.id);
  }, [story?.id, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // auto-progress for images
  useEffect(() => {
    if (!story || story.media_type === "video" || paused || showViewers) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(id);
        goNext();
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [story?.id, paused, showViewers, goNext]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!group || !story) return null;

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) goNext();
      else goPrev();
    } else if (dy < -60 && isOwn) {
      setShowViewers(true);
    } else if (dy > 60) {
      close();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* progress bars */}
      <div className="flex items-center gap-1 px-3 pt-3">
        {group.stories.map((_, i) => (
          <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            <span
              className="block h-full rounded-full bg-white"
              style={{ width: i < si ? "100%" : i === si ? `${progress}%` : "0%" }}
            />
          </span>
        ))}
      </div>

      {/* header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img
            src={group.author.avatar_url || `https://i.pravatar.cc/100?u=${group.author.id}`}
            alt=""
            className="h-9 w-9 rounded-full border border-white/30 object-cover"
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">{group.author.username || group.author.full_name || "user"}</p>
            <p className="text-[11px] text-white/60">{timeAgo(story.created_at)}</p>
          </div>
        </div>
        <button onClick={close} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* media */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {story.media_type === "video" ? (
          <video
            key={story.id}
            src={story.media_url}
            className="max-h-full max-w-full object-contain"
            autoPlay
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
            onEnded={goNext}
          />
        ) : (
          <img src={story.media_url} alt="" className="max-h-full max-w-full object-contain" />
        )}

        {story.text_overlay && (
          <p className="pointer-events-none absolute bottom-24 left-1/2 max-w-[80%] -translate-x-1/2 rounded-2xl bg-black/40 px-4 py-2 text-center text-lg font-semibold text-white backdrop-blur-sm">
            {story.text_overlay}
          </p>
        )}

        {/* tap zones */}
        <button className="absolute left-0 top-0 h-full w-1/3" onClick={goPrev} aria-label="Previous" />
        <button className="absolute right-0 top-0 h-full w-1/3" onClick={goNext} aria-label="Next" />
      </div>

      {/* footer: own = viewers, others = nothing */}
      {isOwn && (
        <button
          onClick={() => setShowViewers(true)}
          className="flex items-center justify-center gap-1.5 py-4 text-sm font-medium text-white/90"
        >
          <ChevronUp className="h-4 w-4" />
          <Eye className="h-4 w-4" />
          {story.views_count} {story.views_count === 1 ? "view" : "views"}
        </button>
      )}

      {showViewers && isOwn && (
        <ViewersSheet storyId={story.id} count={story.views_count} onClose={() => setShowViewers(false)} />
      )}
    </div>
  );
}

function ViewersSheet({ storyId, count, onClose }: { storyId: string; count: number; onClose: () => void }) {
  const [viewers, setViewers] = useState<ViewerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchStoryViewers(storyId)
      .then((v) => active && setViewers(v))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [storyId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70svh] w-full max-w-md flex-col rounded-t-3xl border border-primary/20 bg-card animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <Eye className="h-4 w-4 text-primary" /> {count} {count === 1 ? "viewer" : "viewers"}
          </h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : viewers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No views yet.</p>
          ) : (
            viewers.map((v) => (
              <div key={v.viewer_id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <img
                  src={v.profile?.avatar_url || `https://i.pravatar.cc/100?u=${v.viewer_id}`}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="leading-tight">
                  <p className="text-sm font-medium">{v.profile?.full_name || v.profile?.username || "user"}</p>
                  <p className="text-xs text-muted-foreground">@{v.profile?.username || "user"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h >= 1) return `${h}h ago`;
  const m = Math.floor(diff / 60_000);
  if (m >= 1) return `${m}m ago`;
  return "just now";
}
