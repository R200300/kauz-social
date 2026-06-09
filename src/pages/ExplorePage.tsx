import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchExploreUsers, fetchExplorePosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { PostSkeleton } from "@/components/PostSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "people">("posts");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        if (tab === "posts") {
          const data = await fetchExplorePosts(user?.id);
          setPosts(data);
        } else {
          const data = await fetchExploreUsers(user?.id);
          setPosts(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab, user?.id]);

  return (
    <div className="mx-auto max-w-md pb-20 pt-4">
      <div className="mb-4 flex items-center gap-2 px-4">
        <Compass size={24} />
        <h1 className="text-2xl font-bold">Explore</h1>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("posts")}
          className={`flex-1 py-3 text-sm font-semibold ${tab === "posts" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          Posts
        </button>
        <button
          onClick={() => setTab("people")}
          className={`flex-1 py-3 text-sm font-semibold ${tab === "people" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
        >
          People
        </button>
      </div>

      <div className="px-3 pt-4">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <EmptyState title="Nothing yet" />
        ) : tab === "posts" ? (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userId={user?.id ?? null}
                onDeleted={(id) => setPosts(p => p.filter(x => x.id !== id))}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {posts.map((person) => (
              <a
                key={person.id}
                href={`/u/${person.username}`}
                className="rounded-lg border border-border p-3 text-center hover:bg-muted"
              >
                <img
                  src={person.avatar_url || `https://i.pravatar.cc/100?u=${person.id}`}
                  alt=""
                  className="mb-2 h-16 w-16 rounded-full object-cover mx-auto"
                />
                <p className="text-sm font-semibold">@{person.username}</p>
                {person.full_name && (
                  <p className="text-xs text-muted-foreground">{person.full_name}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}