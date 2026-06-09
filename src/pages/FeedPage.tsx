import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchFeedPosts, type DbPost } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { PostSkeleton } from "@/components/PostSkeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { EmptyState } from "@/components/EmptyState";
import { Heart } from "lucide-react";

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await fetchFeedPosts(user?.id);
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [user?.id]);

  return (
    <PullToRefresh onRefresh={loadPosts}>
      <div className="mx-auto max-w-md space-y-3 pb-20 pt-3 px-3">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No posts yet"
            description="Follow people to see their posts"
          />
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              userId={user?.id ?? null}
              onDeleted={(id) => setPosts(p => p.filter(x => x.id !== id))}
            />
          ))
        )}
      </div>
    </PullToRefresh>
  );
}