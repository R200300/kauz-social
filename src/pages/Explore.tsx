import { Search, Sparkles, Info, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { postImages, trendingTags, avatars, aiPicks, smartSearches } from "@/lib/mock";
import { useAuth } from "@/lib/auth";
import { fetchExploreFeed, type DbPost } from "@/lib/posts";
import { smartSearchSuggestions } from "@/lib/ai.client";

const tabs = ["All", "Photos", "Videos", "People", "Tags"] as const;

export default function Explore() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const { user } = useAuth();
  const [explorePosts, setExplorePosts] = useState<DbPost[]>([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(smartSearches);
  const [loadedSuggestions, setLoadedSuggestions] = useState(false);

  useEffect(() => {
    let active = true;
    fetchExploreFeed(user?.id ?? null, 0)
      .then((rows) => active && setExplorePosts(rows))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function loadSuggestions() {
    if (loadedSuggestions) return;
    setLoadedSuggestions(true);
    const recent = explorePosts
      .flatMap((p) => (p.caption ?? "").match(/#\w+/g) ?? [])
      .slice(0, 12);
    try {
      const { suggestions: out } = await smartSearchSuggestions(recent);
      if (out.length > 0) setSuggestions(out);
    } catch {
      // keep fallback suggestions
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 focus-within:border-primary">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={loadSuggestions}
            placeholder="Search creators, sounds, tags…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="group flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary transition hover:bg-primary/20 hover:shadow-glow-sm"
            >
              <Sparkles className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
        <div className="scrollbar-hide -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                tab === t ? "bg-gradient-primary text-primary-foreground shadow-glow-sm" : "border border-border bg-surface text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <section className="px-4 pt-4">
        <h2 className="text-sm font-semibold">Trending Now</h2>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {trendingTags.map((t) => (
            <button key={t} className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">AI Picked For You</h2>
        </div>
        <div className="scrollbar-hide -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1">
          {aiPicks.map((p, i) => (
            <div key={p.id} className="group relative h-52 w-40 shrink-0 overflow-hidden rounded-2xl border border-primary/30 shadow-glow-sm">
              <img src={p.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <button
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-primary/40 bg-background/70 text-primary backdrop-blur"
                aria-label="Why this?"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
              <div className="pointer-events-none absolute inset-x-2 top-10 origin-top scale-95 rounded-xl border border-primary/40 bg-background/90 p-2 text-[10px] leading-snug text-foreground opacity-0 shadow-glow-sm backdrop-blur transition group-hover:scale-100 group-hover:opacity-100">
                <span className="font-semibold text-primary">Why this?</span> {p.reason}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2">
                <div className="flex items-center gap-1.5">
                  <img src={avatars[i % avatars.length]} alt="" className="h-5 w-5 rounded-full ring-1 ring-primary/60" />
                  <span className="truncate text-[11px] font-medium">@{p.handle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-1 pt-6">
        <h2 className="px-3 pb-3 text-sm font-semibold">Discover</h2>
        {explorePosts.length === 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {postImages.map((img, i) => (
              <div key={i} className="relative aspect-square overflow-hidden">
                <img src={img} alt="" className="h-full w-full object-cover opacity-60" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {explorePosts.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden">
                <img src={p.image_url ?? postImages[0]} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-background/50 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  <Heart className="h-4 w-4 fill-white text-white" />
                  <span className="text-xs font-semibold text-white">{p.likes_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
