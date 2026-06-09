import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchReels, type Reel } from "@/lib/reels";
import { Spinner } from "@/components/Spinner";

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchReels();
        setReels(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-20 pt-4">
      <h1 className="mb-4 px-4 text-2xl font-bold">Reels</h1>
      <div className="space-y-3 px-3">
        {reels.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No reels yet
          </p>
        ) : (
          reels.map((reel) => (
            <div
              key={reel.id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <video
                src={reel.video_url}
                controls
                className="w-full aspect-video"
              />
              {reel.caption && (
                <p className="p-3 text-sm">{reel.caption}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}