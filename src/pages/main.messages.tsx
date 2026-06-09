import { ArrowLeft, Search, Edit3, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  fetchConversations,
  searchUsers,
  subscribeToMessages,
  isOnline,
  type Conversation,
  type ChatUser,
} from "@/lib/messages";
import { Spinner } from "@/components/Spinner";


function timeShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Messages() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const navigate = useNavigate();

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load() {
    if (!userId) return;
    fetchConversations(userId)
      .then(setConvos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!userId) return;
    load();
    const unsub = subscribeToMessages(userId, () => load());
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      searchUsers(query, userId)
        .then(setResults)
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  }, [query, userId]);

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/feed" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Messages</h1>
        <button
          onClick={() => setComposing((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
          aria-label="New message"
        >
          {composing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
        </button>
      </header>

      {composing && (
        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a username to message..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {query.trim() && (
            <ul className="mt-2 overflow-hidden rounded-2xl border border-border bg-surface">
              {searching && (
                <li className="grid place-items-center py-5">
                  <Spinner size={20} />
                </li>
              )}
              {!searching && results.length === 0 && (
                <li className="px-4 py-4 text-center text-xs text-muted-foreground">No users found.</li>
              )}
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => navigate(`/messages/${u.id}`)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-elevated"
                  >
                    <img
                      src={u.avatar_url ?? `https://i.pravatar.cc/200?u=${u.id}`}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{u.full_name ?? u.username}</p>
                      <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20">
          <Spinner size={28} />
        </div>
      ) : convos.length === 0 ? (
        <p className="px-6 py-20 text-center text-sm text-muted-foreground">
          No conversations yet. Tap the pencil to message someone ✨
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {convos.map((c) => {
            const name = c.partner.full_name ?? c.partner.username ?? "User";
            const preview =
              (c.lastMessage.sender_id === userId ? "You: " : "") + c.lastMessage.content;
            return (
              <li key={c.partner.id}>
                <Link
                  to={`/messages/${c.partner.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface"
                >
                  <span className="relative shrink-0">
                    <img
                      src={c.partner.avatar_url ?? `https://i.pravatar.cc/200?u=${c.partner.id}`}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    {isOnline(c.partner.last_seen) && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeShort(c.lastMessage.created_at)}
                      </span>
                    </div>
                    <p
                      className={`truncate text-xs ${c.unread ? "font-medium text-foreground" : "text-muted-foreground"}`}
                    >
                      {preview}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shadow-glow-sm">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}