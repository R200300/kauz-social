import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { fetchStories, type Story } from "@/lib/stories";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";
import { StoryViewer } from "@/components/StoryViewer";
import { CreateStorySheet } from "@/components/CreateStorySheet";

export function StoryTray({ onStoriesLoaded }: { onStoriesLoaded?: () => void }) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Story | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    fetchStories(user?.id)
      .then((rows) => {
        if (active) {
          setStories(rows);
          onStoriesLoaded?.();
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user?.id, onStoriesLoaded]);

  if (loading) {
    return (
      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-3 py-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 w-16 shrink-0 rounded-xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="scrollbar-hide flex gap-3 overflow-x-auto px-3 py-3">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => setViewing(story)}
            className="group relative h-20 w-16 shrink-0 overflow-hidden rounded-xl"
          >
            <img src={story.image_url} alt="Story" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
            {story.user && (
              <div className="absolute bottom-1 left-1 h-6 w-6 rounded-full ring-2 ring-primary overflow-hidden">
                <img src={story.user.avatar_url} alt="" className="h-full w-full object-cover" />
              </div>
            )}
          </button>
        ))}
        {user && (
          <button
            onClick={() => setCreating(true)}
            className="flex h-20 w-16 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary"
          >
            <Plus size={20} className="text-primary" />
          </button>
        )}
      </div>
      {viewing && <StoryViewer story={viewing} onClose={() => setViewing(null)} />}
      {creating && (
        <CreateStorySheet
          open={creating}
          onClose={() => setCreating(false)}
          onStoryCreated={() => {
            setCreating(false);
            fetchStories(user?.id)
              .then(setStories)
              .catch(() => {});
          }}
        />
      )}
    </>
  );
}