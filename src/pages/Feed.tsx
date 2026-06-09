import { TopBar } from "@/components/TopBar";
import { PostCard } from "@/components/PostCard";
import { PostSkeleton } from "@/components/PostSkeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { StoryTray } from "@/components/StoryTray";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchFollowingFeed, fetchPostById, PAGE_SIZE, type DbPost } from "@/lib/posts";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Feed() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(
    async (p: number, replace: boolean) => {
      if (!userId) return;
      const rows = await fetchFollowingFeed(userId, p);
      setHasMore(rows.length === PAGE_SIZE);
      setPosts((prev) => {
        const base = replace ? [] : prev;
        const seen = new Set(base.map((x) => x.id));
        return [...base, ...rows.filter((r) => !seen.has(r.id))];
      });
    },
    [userId],
  );

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setPage(0);
    fetchFollowingFeed(userId, 0)
      .then((rows) => {
        if (!active) return;
        setPosts(rows);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  // Realtime: prepend new posts from followed users / self
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("feed-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const newId = (payload.new as { id: string; user_id: string }).id;
          const post = await fetchPostById(newId, userId);
          if (!post) return;
          setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el || loading || !hasMore) return;
    const obs = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          setLoadingMore(true);
          const next = page + 1;
          await loadPage(next, false);
          setPage(next);
          setLoadingMore(false);
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, hasMore, loadingMore, page, loadPage]);

  async function refresh() {
    setPage(0);
    await loadPage(0, true);
  }

  const empty = !loading && posts.length === 0;

  return (
    <>
      <TopBar />
      <PullToRefresh onRefresh={refresh}>
        <main className="mx-auto max-w-md">
          {/* Stories */}
          <StoryTray />

          <section className="space-y-4 px-3">
            {loading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : empty ? (
              <EmptyState />
            ) : (
              <>
                {posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    userId={userId}
                    onDeleted={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
                  />
                ))}
                <div ref={sentinel} />
                {loadingMore && (
                  <div className="grid place-items-center py-4">
                    <Spinner size={26} />
                  </div>
                )}
                {!hasMore && (
                  <p className="pb-4 pt-2 text-center text-xs text-muted-foreground">You're all caught up ✨</p>
                )}
              </>
            )}
          </section>
        </main>
      </PullToRefresh>
    </>
  );
}
