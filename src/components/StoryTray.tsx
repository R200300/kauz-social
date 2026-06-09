import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchStoryTray, type StoryGroup } from "@/lib/stories";
import { StoryViewer } from "@/components/StoryViewer";
import { CreateStorySheet } from "@/components/CreateStorySheet";

export function StoryTray() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    if (!userId) return;
    fetchStoryTray(userId)
      .then(setGroups)
      .catch(() => {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!userId) return null;

  const ownGroup = groups.find((g) => g.author.id === userId) ?? null;
  const otherGroups = groups.filter((g) => g.author.id !== userId);
  const ownAvatar =
    ownGroup?.author.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    `https://i.pravatar.cc/200?u=${userId}`;

  function openGroup(g: StoryGroup) {
    const idx = groups.findIndex((x) => x.author.id === g.author.id);
    if (idx >= 0) setOpenAt(idx);
  }

  // Ring "seen" state is reconciled from the server when the viewer closes.
  function markGroupSeen(_storyId: string) {}

  return (
    <>
      <section className="scrollbar-hide flex gap-4 overflow-x-auto px-4 py-4">
        {/* Your story */}
        <button
          onClick={() => (ownGroup ? openGroup(ownGroup) : setCreating(true))}
          className="tap-pulse flex w-16 shrink-0 flex-col items-center gap-1.5"
        >
          <span className="relative block h-16 w-16">
            {ownGroup ? (
              <span className={ringClass(ownGroup.allSeen)}>
                <img src={ownAvatar} alt="" className="h-full w-full rounded-full border-2 border-background object-cover" />
              </span>
            ) : (
              <img src={ownAvatar} alt="" className="h-full w-full rounded-full border-2 border-border object-cover" />
            )}
            <span
              onClick={(e) => {
                e.stopPropagation();
                setCreating(true);
              }}
              className="absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-gradient-primary text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </span>
          </span>
          <span className="w-full truncate text-center text-[11px] text-muted-foreground">Your story</span>
        </button>

        {/* Followed users' stories */}
        {otherGroups.map((g) => (
          <button
            key={g.author.id}
            onClick={() => openGroup(g)}
            className="tap-pulse flex w-16 shrink-0 flex-col items-center gap-1.5"
          >
            <span className={ringClass(g.allSeen)}>
              <img
                src={g.author.avatar_url || `https://i.pravatar.cc/200?u=${g.author.id}`}
                alt={g.author.username ?? ""}
                className="h-full w-full rounded-full border-2 border-background object-cover"
              />
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">
              {g.author.username || g.author.full_name || "user"}
            </span>
          </button>
        ))}
      </section>

      {openAt !== null && (
        <StoryViewer
          groups={groups}
          startGroup={openAt}
          userId={userId}
          onClose={() => {
            setOpenAt(null);
            load();
          }}
          onSeen={markGroupSeen}
        />
      )}

      {creating && (
        <CreateStorySheet
          userId={userId}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </>
  );
}

function ringClass(seen: boolean): string {
  return seen
    ? "block h-16 w-16 rounded-full bg-muted p-[2px]"
    : "block h-16 w-16 rounded-full bg-gradient-primary p-[2px] shadow-glow-sm";
}
