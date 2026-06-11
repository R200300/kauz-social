"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  Home,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/kauz/button";
import { BrandMark } from "@/components/kauz/brand";
import { useAuth } from "@/lib/firebase/auth-context";
import { createPost, fetchPosts, type KauzPost } from "@/lib/firebase/posts";

const navItems = [Home, Search, Plus, Bell, UsersRound];

function formatCount(count: number) {
  if (count > 999) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

function PostCard({ post }: { post: KauzPost }) {
  return (
    <article className="glass-panel overflow-hidden rounded-[2rem]">
      <div className={`h-44 bg-gradient-to-br ${post.accent} p-5`}>
        <span className="rounded-full bg-black/22 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/88">
          {post.cause}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="kauz-gradient grid h-11 w-11 place-items-center rounded-2xl text-sm font-black text-white">
            {post.authorName.slice(0, 1)}
          </div>
          <div>
            <h2 className="font-black tracking-[-0.035em] text-white">{post.authorName}</h2>
            <p className="text-xs text-white/42">@{post.authorHandle}</p>
          </div>
        </div>
        <p className="mt-4 text-[15px] leading-7 text-white/72">{post.content}</p>
        <div className="mt-5 flex items-center justify-between text-sm text-white/54">
          <button className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 font-bold text-fuchsia-100">
            <Heart className="h-4 w-4" /> {formatCount(post.supporters)}
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
            <MessageCircle className="h-4 w-4" /> {post.comments}
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2">
            <Send className="h-4 w-4" /> Share
          </button>
        </div>
      </div>
    </article>
  );
}

function Composer({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [cause, setCause] = useState("Community Action");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    await createPost({
      authorName: user?.displayName || "Kauz Member",
      authorHandle: user?.email?.split("@")[0] || "demo.member",
      cause,
      content,
    });
    setContent("");
    setSaving(false);
    onCreated();
  }

  return (
    <form className="glass-panel rounded-[2rem] p-4" onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <div className="kauz-gradient grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black text-white">
          {(user?.displayName || "K").slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/36 focus:border-fuchsia-300/50"
            value={cause}
            onChange={(event) => setCause(event.target.value)}
            placeholder="Cause name"
          />
          <textarea
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/36 focus:border-fuchsia-300/50"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share an update with your Kauz circle..."
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button className="min-h-10 px-4" disabled={saving} type="submit">
          {saving ? "Posting..." : "Post update"}
        </Button>
      </div>
    </form>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { user, loading, configured, logout } = useAuth();
  const [posts, setPosts] = useState<KauzPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  async function loadPosts() {
    setLoadingPosts(true);
    setPosts(await fetchPosts());
    setLoadingPosts(false);
  }

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/login");
  }, [configured, loading, router, user]);

  useEffect(() => {
    loadPosts();
  }, []);

  if (loading) {
    return (
      <main className="grid min-h-[100svh] place-items-center text-white/60">Loading Kauz...</main>
    );
  }

  return (
    <main className="min-h-[100svh] px-4 pb-28 pt-4 sm:px-6">
      <header className="sticky top-0 z-20 mx-auto flex max-w-2xl items-center justify-between rounded-b-[2rem] bg-[#07070f]/82 py-3 backdrop-blur-xl">
        <BrandMark />
        <div className="flex items-center gap-2">
          <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70">
            <Bell className="h-5 w-5" />
          </button>
          <button
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70"
            onClick={() => logout().then(() => router.push("/login"))}
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <section className="mx-auto mt-5 max-w-2xl space-y-5">
        {!configured ? (
          <div className="rounded-[2rem] border border-lime-300/20 bg-lime-300/10 p-4 text-sm leading-6 text-lime-100">
            Firebase is not configured, so the feed is using seeded demo content. Add
            NEXT_PUBLIC_FIREBASE_* values to turn on Firebase Authentication and Firestore.
          </div>
        ) : null}

        <div className="glass-panel rounded-[2rem] p-5">
          <div className="flex items-center gap-3">
            <span className="kauz-gradient grid h-12 w-12 place-items-center rounded-2xl">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-[-0.06em]">Home Feed</h1>
              <p className="text-sm text-white/50">Cause updates, campaigns, and community wins.</p>
            </div>
          </div>
          <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto">
            {["Clean water", "Mutual aid", "Youth arts", "Climate", "Local shelters"].map(
              (topic) => (
                <span
                  key={topic}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/68"
                >
                  {topic}
                </span>
              ),
            )}
          </div>
        </div>

        <Composer onCreated={loadPosts} />

        {loadingPosts ? (
          <div className="glass-panel rounded-[2rem] p-8 text-center text-white/55">
            Loading posts...
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-[min(92vw,430px)] justify-between rounded-[2rem] border border-white/10 bg-[#141222]/90 p-2 shadow-2xl backdrop-blur-xl">
        {navItems.map((Icon, index) => (
          <button
            key={index}
            className={`grid h-12 w-12 place-items-center rounded-2xl ${index === 0 ? "kauz-gradient text-white" : "text-white/48"}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </nav>
    </main>
  );
}
