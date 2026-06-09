import { Link, useNavigate } from "react-router-dom";
import { Settings, Grid3x3, Clapperboard, Bookmark, Tag, Link as LinkIcon, UserCheck, UserPlus, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  fetchProfileById,
  fetchProfileStats,
  isFollowing as checkFollowing,
  followUser,
  unfollowUser,
  type ProfileRow,
} from "@/lib/profiles";
import { fetchUserPosts, fetchSavedPosts, type DbPost } from "@/lib/posts";
import { Spinner } from "@/components/Spinner";
import { Highlights } from "@/components/Highlights";
import { FollowListSheet } from "@/components/FollowListSheet";
import { postImages } from "@/lib/mock";

const ownTabs = [
  { id: "posts", icon: Grid3x3 },
  { id: "reels", icon: Clapperboard },
  { id: "saved", icon: Bookmark },
  { id: "tagged", icon: Tag },
] as const;

const otherTabs = [
  { id: "posts", icon: Grid3x3 },
  { id: "reels", icon: Clapperboard },
  { id: "tagged", icon: Tag },
] as const;

export function ProfileView({ profileId, isOwn }: { profileId: string; isOwn: boolean }) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
  const navigate = useNavigate();

  const [tab, setTab] = useState<string>("posts");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [saved, setSaved] = useState<DbPost[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [listMode, setListMode] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProfileById(profileId)
      .then((p) => active && setProfile(p))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    // Authoritative counts from source tables (cached columns may be stale).
    fetchProfileStats(profileId)
      .then((stats) => active && setProfile((p) => (p ? { ...p, ...stats } : p)))
      .catch(() => {});
    fetchUserPosts(profileId, currentUserId)
      .then((rows) => active && setPosts(rows))
      .catch(() => {});
    if (!isOwn && currentUserId) {
      checkFollowing(currentUserId, profileId)
        .then((f) => active && setFollowing(f))
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [profileId, currentUserId, isOwn]);

  useEffect(() => {
    if (tab !== "saved" || !isOwn || !currentUserId) return;
    let active = true;
    setLoadingSaved(true);
    fetchSavedPosts(currentUserId)
      .then((rows) => active && setSaved(rows))
      .catch(() => {})
      .finally(() => active && setLoadingSaved(false));
    return () => {
      active = false;
    };
  }, [tab, isOwn, currentUserId]);

  async function toggleFollow() {
    if (!currentUserId || followBusy) return;
    setFollowBusy(true);
    const next = !following;
    setFollowing(next);
    setProfile((p) =>
      p ? { ...p, followers_count: Math.max(0, p.followers_count + (next ? 1 : -1)) } : p,
    );
    try {
      if (next) await followUser(currentUserId, profileId);
      else await unfollowUser(currentUserId, profileId);
    } catch {
      setFollowing(!next);
      setProfile((p) =>
        p ? { ...p, followers_count: Math.max(0, p.followers_count + (next ? -1 : 1)) } : p,
      );
    } finally {
      setFollowBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (!profile) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Profile not found.</p>;
  }

  const displayName = profile.full_name || profile.username || "Profile";
  const handle = profile.username || "user";
  const avatar = profile.avatar_url || null;
  const initial = (profile.full_name || profile.username || "?").trim().charAt(0).toUpperCase();
  const tabs = isOwn ? ownTabs : otherTabs;

  return (
    <div className="mx-auto max-w-md">
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-[#7c3aed]/40 via-[#7c3aed]/15 to-background">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        {isOwn && (
          <Link to="/settings" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="-mt-12 px-4">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="h-20 w-20 rounded-full border-4 border-background object-cover ring-2 ring-[#7c3aed] shadow-glow-sm"
          />
        ) : (
          <div
            className="grid h-20 w-20 place-items-center rounded-full border-4 border-background ring-2 ring-[#7c3aed] shadow-glow-sm"
            style={{ backgroundColor: "#7c3aed" }}
            aria-label={displayName}
          >
            <span className="font-display text-2xl font-bold text-white">{initial}</span>
          </div>
        )}
        <div className="mt-3">
          <h1 className="font-display text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-sm font-medium text-[#a78bfa]">@{handle}</p>
          {profile.bio && <p className="mt-2 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary">
              <LinkIcon className="h-3.5 w-3.5" /> {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-border/60 rounded-2xl border border-border bg-surface py-3 text-center">
          <div>
            <p className="font-display text-lg font-bold">{profile.posts_count ?? 0}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <button onClick={() => setListMode("followers")}>
            <p className="font-display text-lg font-bold">{profile.followers_count ?? 0}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </button>
          <button onClick={() => setListMode("following")}>
            <p className="font-display text-lg font-bold">{profile.following_count ?? 0}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </button>
        </div>


        <div className="mt-4 flex gap-2">
          {isOwn ? (
            <>
              <button
                onClick={() => navigate("/edit-profile")}
                className="flex-1 rounded-2xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm"
              >
                Edit Profile
              </button>
              <button className="flex-1 rounded-2xl border border-border bg-surface py-2.5 text-sm font-semibold">
                Share
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleFollow}
                disabled={followBusy || !currentUserId}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                  following
                    ? "border border-border bg-surface text-foreground"
                    : "bg-gradient-primary text-primary-foreground shadow-glow-sm"
                }`}
              >
                {following ? (
                  <>
                    <UserCheck className="h-4 w-4" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Follow
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/messages/${profileId}`)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface py-2.5 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" /> Message
              </button>
            </>
          )}
        </div>

        <Highlights userId={profileId} isOwn={isOwn} />
      </div>

      <div className="mt-4 flex border-y border-border/60">
        {tabs.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center py-3 ${tab === id ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <PostGrid posts={posts} emptyText={isOwn ? "No posts yet - share your first ✨" : "No posts yet."} />
      )}
      {tab === "saved" && isOwn && (
        loadingSaved ? (
          <div className="grid place-items-center py-12">
            <Spinner size={28} />
          </div>
        ) : (
          <PostGrid posts={saved} emptyText="Tap the bookmark on a post to save it here." />
        )
      )}
      {(tab === "reels" || tab === "tagged") && (
        <p className="py-12 text-center text-sm text-muted-foreground">Nothing here yet.</p>
      )}

      {listMode && (
        <FollowListSheet
          profileId={profileId}
          currentUserId={currentUserId}
          mode={listMode}
          onClose={() => setListMode(null)}
        />
      )}
    </div>
  );
}

function PostGrid({ posts, emptyText }: { posts: DbPost[]; emptyText: string }) {
  if (posts.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {posts.map((p) => (
        <div key={p.id} className="relative aspect-square overflow-hidden">
          <img src={p.image_url ?? postImages[0]} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}