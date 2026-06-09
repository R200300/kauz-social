import { useEffect, useState } from "react";
import { X, UserCheck, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchFollowers,
  fetchFollowing,
  followUser,
  unfollowUser,
  type FollowUser,
} from "@/lib/profiles";
import { Spinner } from "@/components/Spinner";

export function FollowListSheet({
  profileId,
  currentUserId,
  mode,
  onClose,
}: {
  profileId: string;
  currentUserId: string | null;
  mode: "followers" | "following";
  onClose: () => void;
}) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const fetcher = mode === "followers" ? fetchFollowers : fetchFollowing;
    fetcher(profileId, currentUserId)
      .then((rows) => active && setUsers(rows))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profileId, currentUserId, mode]);

  async function toggle(u: FollowUser) {
    if (!currentUserId || busy) return;
    setBusy(u.id);
    const next = !u.isFollowing;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isFollowing: next } : x)));
    try {
      if (next) await followUser(currentUserId, u.id);
      else await unfollowUser(currentUserId, u.id);
    } catch {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isFollowing: !next } : x)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-[70svh] w-full max-w-md flex-col rounded-t-3xl border border-primary/20 bg-card shadow-glow animate-slide-up"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="font-display text-base font-semibold capitalize">{mode}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid place-items-center py-10">
              <Spinner size={28} />
            </div>
          ) : users.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-surface">
                <Link
                  to={`/u/${u.username ?? u.id}`}
                  onClick={onClose}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <img
                    src={u.avatar_url ?? `https://i.pravatar.cc/100?u=${u.id}`}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-primary/40"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">@{u.username ?? "user"}</p>
                    {u.full_name && (
                      <p className="truncate text-xs text-muted-foreground">{u.full_name}</p>
                    )}
                  </div>
                </Link>
                {currentUserId && u.id !== currentUserId && (
                  <button
                    onClick={() => toggle(u)}
                    disabled={busy === u.id}
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${u.isFollowing ? "border border-border bg-surface text-foreground" : "bg-gradient-primary text-primary-foreground shadow-glow-sm"}`}
                  >
                    {u.isFollowing ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" /> Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}