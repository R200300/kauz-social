import { useRef, useState } from "react";
import { X, ImagePlus, Type, Smile } from "lucide-react";
import { toast } from "sonner";
import { createStory } from "@/lib/stories";
import { Spinner } from "@/components/Spinner";

const STICKERS = ["✨", "🔥", "💜", "😂", "🎉", "👀", "🌙", "⭐"];

export function CreateStorySheet({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setIsVideo(f.type.startsWith("video/"));
    setPreview(URL.createObjectURL(f));
  }

  async function publish() {
    if (!file) {
      toast.error("Pick a photo or video first");
      return;
    }
    setSaving(true);
    try {
      await createStory(userId, file, text);
      toast.success("Story shared ✨");
      onCreated();
    } catch {
      toast.error("Couldn't share story");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[88svh] w-full max-w-md flex-col rounded-t-3xl border border-primary/20 bg-card shadow-glow animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="font-display text-base font-semibold">New Story</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={pick} />

          {!preview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="grid aspect-[9/16] w-full place-items-center rounded-3xl border-2 border-dashed border-border bg-surface text-muted-foreground"
            >
              <span className="flex flex-col items-center gap-2">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Tap to add photo or video</span>
              </span>
            </button>
          ) : (
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl bg-black">
              {isVideo ? (
                <video src={preview} className="h-full w-full object-contain" autoPlay loop muted playsInline />
              ) : (
                <img src={preview} alt="" className="h-full w-full object-contain" />
              )}
              {text && (
                <p className="pointer-events-none absolute bottom-16 left-1/2 max-w-[80%] -translate-x-1/2 rounded-2xl bg-black/40 px-4 py-2 text-center text-lg font-semibold text-white backdrop-blur-sm">
                  {text}
                </p>
              )}
              <button
                onClick={() => inputRef.current?.click()}
                className="absolute right-3 top-3 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white"
              >
                Change
              </button>
            </div>
          )}

          {/* text overlay */}
          <label className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5">
            <Type className="h-4 w-4 text-muted-foreground" />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
              placeholder="Add a text overlay…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {/* stickers */}
          <div className="mt-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Smile className="h-3.5 w-3.5" /> Add a sticker
            </p>
            <div className="flex flex-wrap gap-2">
              {STICKERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setText((t) => (t + " " + s).trim())}
                  className="tap-pulse grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-xl"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 p-4">
          <button
            onClick={publish}
            disabled={saving || !file}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-60"
          >
            {saving ? <Spinner size={18} /> : "Share to Story"}
          </button>
        </div>
      </div>
    </div>
  );
}
