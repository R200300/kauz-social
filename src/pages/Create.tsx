import { Link, useNavigate } from "react-router-dom";
import { ImagePlus, Sparkles, MapPin, Users, Globe, ChevronDown, X, Loader2, ShieldAlert } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createPost } from "@/lib/posts";
import { generateCaptions, moderateImage } from "@/lib/ai.client";
import { fileToScaledDataUrl } from "@/lib/ai-image";
import { toast } from "sonner";

const suggestions = ["#AIart", "#NeonNights", "#Reels", "#Mumbai", "#Design"];
const audiences = [
  { id: "everyone", label: "Everyone", icon: Globe },
  { id: "followers", label: "Followers", icon: Users },
  { id: "close", label: "Close Friends", icon: Users },
] as const;

export default function Create() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<(typeof audiences)[number]["id"]>("everyone");
  const [showAud, setShowAud] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCaptions, setAiCaptions] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [moderation, setModeration] = useState<{ reason: string } | null>(null);
  const ActiveIcon = audiences.find((a) => a.id === audience)!.icon;

  async function openAi() {
    if (!file) {
      toast.error("Add a photo first to generate captions.");
      return;
    }
    setAiOpen(true);
    setAiLoading(true);
    setAiCaptions([]);
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      const { captions } = await generateCaptions(dataUrl);
      if (captions.length === 0) toast.error("Couldn't generate captions — try again.");
      setAiCaptions(captions);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI caption failed.");
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  }

  function pickFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function publish() {
    if (!user || !file) return;
    setPosting(true);
    try {
      await createPost(user.id, file, caption);
      toast.success("Posted! ✨");
      navigate("/feed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload your post.");
      setPosting(false);
    }
  }

  async function submit() {
    if (!user) {
      toast.error("Please log in to post.");
      return;
    }
    if (!file) {
      toast.error("Add a photo first.");
      return;
    }
    setPosting(true);
    // Content moderation before upload.
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      const result = await moderateImage(dataUrl);
      if (result.severe) {
        setPosting(false);
        toast.error(`Upload blocked: ${result.reason || "inappropriate content"}.`);
        return;
      }
      if (result.flagged) {
        setPosting(false);
        setModeration({ reason: result.reason || "This image may contain sensitive content." });
        return;
      }
    } catch {
      // If moderation is unavailable, fail open and let the user post.
    }
    await publish();
  }

  return (
    <div className="mx-auto max-w-md">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/feed" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface" aria-label="Close">
          <X className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">New Post</h1>
        <button
          onClick={submit}
          disabled={posting || !file}
          className="flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-50"
        >
          {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {posting ? "Posting…" : "Post"}
        </button>
      </header>

      <div className="space-y-5 p-4">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-surface text-center hover:border-primary/60 hover:bg-surface-elevated"
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium backdrop-blur">
                Change photo
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow-sm">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium text-foreground">Upload photo</span>
              <span className="text-xs">Tap to browse</span>
            </div>
          )}
        </button>

        <div className="rounded-2xl border border-border bg-surface p-3">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption…"
            rows={4}
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setCaption((c) => (c + " " + s).trim())}
                className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={openAi}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20 hover:shadow-glow-sm"
          >
            <Sparkles className="h-4 w-4" /> ✨ AI Caption
          </button>
        </div>

        <ul className="overflow-hidden rounded-2xl border border-border bg-surface text-sm">
          <li className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Tag people</span>
            <span className="text-xs text-muted-foreground">Add</span>
          </li>
          <li className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1">Add location</span>
            <span className="text-xs text-muted-foreground">Add</span>
          </li>
          <li>
            <button onClick={() => setShowAud((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <ActiveIcon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1">Audience</span>
              <span className="text-xs text-primary">{audiences.find((a) => a.id === audience)!.label}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
            {showAud && (
              <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                {audiences.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setAudience(id); setShowAud(false); }}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs ${
                      audience === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </li>
        </ul>
      </div>

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-fade-in sm:items-center" onClick={() => setAiOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl border border-primary/30 bg-card p-5 shadow-glow animate-slide-up sm:rounded-3xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="font-display text-base font-semibold">AI Caption Suggestions</h3>
              </div>
              <button onClick={() => setAiOpen(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface">
                <X className="h-4 w-4" />
              </button>
            </div>

            {aiLoading ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Crafting captions for you…</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {aiCaptions.map((c, i) => (
                  <li key={i} className="rounded-2xl border border-border bg-surface p-3 transition hover:border-primary/50">
                    <p className="text-sm leading-relaxed">{c}</p>
                    <button
                      onClick={() => { setCaption(c); setAiOpen(false); }}
                      className="mt-2 rounded-full bg-gradient-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow-sm"
                    >
                      Use This
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {moderation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setModeration(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-glow">
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-display text-base font-semibold text-foreground">Sensitive content?</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{moderation.reason} Post anyway?</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setModeration(null)}
                className="flex-1 rounded-full border border-border bg-surface py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => { setModeration(null); publish(); }}
                className="flex-1 rounded-full bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm"
              >
                Post anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
