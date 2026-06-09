import { useEffect, useState } from "react";
import { X, Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchHighlights,
  fetchHighlightItems,
  fetchOwnStories,
  createHighlight,
  deleteHighlight,
  type Highlight,
  type HighlightItem,
} from "@/lib/profiles";
import { Spinner } from "@/components/Spinner";

export function Highlights({ userId, isOwn }: { userId: string; isOwn: boolean }) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Highlight | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    fetchHighlights(userId)
      .then(setHighlights)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetchHighlights(userId)
      .then((rows) => active && setHighlights(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="mt-5 flex justify-center py-2">
        <Spinner size={20} />
      </div>
    );
  }

  if (highlights.length === 0 && !isOwn) return null;

  return (
    <>
      <div className="scrollbar-hide mt-5 flex gap-4 overflow-x-auto pb-2">
        {highlights.map((h) => (
          <button
            key={h.id}
            onClick={() => setViewing(h)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span className="block rounded-full bg-gradient-primary p-[2px] shadow-glow-sm">
              <span className="block rounded-full border-2 border-background">
                {h.cover_url ? (
                  <img src={h.cover_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-lg">✨</span>
                )}
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">{h.title}</span>
          </button>
        ))}

        {isOwn && (
          <button
            onClick={() => setCreating(true)}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span className="grid h-[60px] w-[60px] place-items-center rounded-full border-2 border-dashed border-border bg-surface text-muted-foreground">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[11px] text-muted-foreground">New</span>
          </button>
        )}
      </div>

      {viewing && (
        <HighlightViewer
          highlight={viewing}
          isOwn={isOwn}
          onClose={() => setViewing(null)}
          onDeleted={() => {
            setViewing(null);
            load();
          }}
        />
      )}
      {creating && (
        <CreateHighlightSheet
          userId={userId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </>
  );
}

function HighlightViewer({
  highlight,
  isOwn,
  onClose,
  onDeleted,
}: {
  highlight: Highlight;
  isOwn: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [items, setItems] = useState<HighlightItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchHighlightItems(highlight.id)
      .then((rows) => active && setItems(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [highlight.id]);

  const current = items[idx];

  async function remove() {
    try {
      await deleteHighlight(highlight.id);
      toast.success("Highlight deleted");
      onDeleted();
    } catch {
      toast.error("Couldn't delete highlight");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fade-in">
      <div className="flex items-center gap-2 px-4 pt-4">
        {items.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-white">{highlight.title}</span>
        <div className="flex items-center gap-2">
          {isOwn && (
            <button onClick={remove} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white" aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {loading ? (
          <Spinner size={32} />
        ) : current ? (
          <img src={current.media_url} alt="" className="max-h-full max-w-full object-contain" />
        ) : (
          <p className="text-sm text-white/70">This highlight is empty.</p>
        )}
        {items.length > 1 && (
          <>
            <button className="absolute left-0 top-0 h-full w-1/3" onClick={() => setIdx((i) => Math.max(0, i - 1))} aria-label="Previous" />
            <button className="absolute right-0 top-0 h-full w-1/3" onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))} aria-label="Next" />
          </>
        )}
      </div>
    </div>
  );
}

function CreateHighlightSheet({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [stories, setStories] = useState<Array<{ id: string; media_url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchOwnStories(userId)
      .then((rows) => active && setStories(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  function toggle(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function save() {
    if (selected.size === 0) {
      toast.error("Pick at least one story");
      return;
    }
    setSaving(true);
    try {
      await createHighlight(userId, title, [...selected]);
      toast.success("Highlight created ✨");
      onCreated();
    } catch {
      toast.error("Couldn't create highlight");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[80svh] w-full max-w-md flex-col rounded-t-3xl border border-primary/20 bg-card shadow-glow animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="font-display text-base font-semibold">New Highlight</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Highlight name"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground"
          />
          <p className="mt-3 text-xs text-muted-foreground">Pick from your stories</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-3">
          {loading ? (
            <div className="grid place-items-center py-10">
              <Spinner size={28} />
            </div>
          ) : stories.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No stories yet. Post a story to create highlights from it.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {stories.map((s) => {
                const on = selected.has(s.media_url);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.media_url)}
                    className={`relative aspect-square overflow-hidden rounded-xl ${on ? "ring-2 ring-primary" : "ring-1 ring-border"}`}
                  >
                    <img src={s.media_url} alt="" className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 p-4">
          <button
            onClick={save}
            disabled={saving || selected.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-50"
          >
            {saving ? <Spinner size={16} /> : `Create highlight (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}
