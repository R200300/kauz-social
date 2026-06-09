import { Bell, Heart, MessageCircle, UserPlus, Bot, CheckCheck, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  insertAiInsight,
  type DbNotification,
} from "@/lib/notifications";
import { fetchProfileById } from "@/lib/profiles";
import { fetchUserPosts } from "@/lib/posts";
import { generateInsight } from "@/lib/ai.client";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { Spinner } from "@/components/Spinner";
import { useNavigate } from "react-router-dom";

const tabs = ["All", "Likes", "Comments", "Follows", "AI Insights"] as const;

function iconFor(type: string) {
  if (type === "like") return <Heart className="h-4 w-4 text-primary" />;
  if (type === "comment") return <MessageCircle className="h-4 w-4 text-primary" />;
  if (type === "follow") return <UserPlus className="h-4 w-4 text-primary" />;
  return <Bell className="h-4 w-4 text-primary" />;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Notifications() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();

  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [items, setItems] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  function load() {
    if (!userId) return;
    fetchNotifications(userId)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!userId) return;
    load();
    const unsub = subscribeToNotifications(userId, () => load());
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function markAll() {
    if (!userId) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await markAllNotificationsRead(userId).catch(() => {});
  }

  async function open(n: DbNotification) {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.post_id) navigate("/feed");
    else if (n.type === "follow" && n.actor?.username)
      navigate(`/u/${n.actor.username}`);
  }

  async function genInsight() {
    if (!userId || generating) return;
    setGenerating(true);
    try {
      const [profile, posts] = await Promise.all([
        fetchProfileById(userId),
        fetchUserPosts(userId, userId),
      ]);
      const totalLikes = posts.reduce((s, p) => s + (p.likes_count ?? 0), 0);
      const { insight } = await generateInsight({
        postsCount: profile?.posts_count ?? posts.length,
        followersCount: profile?.followers_count ?? 0,
        totalLikes,
      });
      if (!insight) throw new Error("empty");
      await insertAiInsight(userId, insight);
      load();
      toast.success("New AI insight ✨");
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "empty" ? err.message : "Couldn't generate an insight.");
    } finally {
      setGenerating(false);
    }
  }

  const filtered = items.filter((n) => {
    if (tab === "All") return true;
    if (tab === "AI Insights") return n.type === "ai_insight";
    return n.type === tab.toLowerCase().replace(/s$/, "");
  });

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <>
      <TopBar />
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <h1 className="font-display text-base font-semibold">Activity</h1>
          <button
            onClick={markAll}
            disabled={!hasUnread}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-40"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-border/60 px-4 py-3">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
                tab === t
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-sm"
                  : "border border-border bg-surface text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "AI Insights" && (
          <div className="px-4 pt-4">
            <button
              onClick={genInsight}
              disabled={generating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 hover:shadow-glow-sm disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Analyzing your activity…" : "Generate today's AI insight"}
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-20">
            <Spinner size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-6 py-20 text-center text-sm text-muted-foreground">
            {tab === "AI Insights" ? "No AI insights yet." : "Nothing here yet."}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {filtered.map((n) => {
              const isAi = n.type === "ai_insight";
              const handle = n.actor?.username ?? "someone";
              return (
                <li key={n.id}>
                  <button
                    onClick={() => open(n)}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition ${
                      n.is_read ? "" : "bg-primary/5"
                    }`}
                  >
                    {isAi ? (
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 ring-1 ring-primary/40">
                        <Bot className="h-5 w-5 text-primary" />
                      </span>
                    ) : (
                      <span className="relative shrink-0">
                        <img
                          src={n.actor?.avatar_url ?? `https://i.pravatar.cc/200?u=${n.actor_id}`}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-1 ring-primary/40"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-background ring-1 ring-border">
                          {iconFor(n.type)}
                        </span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {isAi ? (
                          <span className="font-medium">🤖 {n.message}</span>
                        ) : (
                          <>
                            <span className="font-semibold">@{handle}</span>{" "}
                            <span className="text-muted-foreground">{n.message}</span>
                          </>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary shadow-glow-sm" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
