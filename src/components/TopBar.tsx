import { Link } from "react-router-dom";
import { Bell, Search, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { fetchUnreadCount, subscribeToNotifications } from "@/lib/notifications";

export function TopBar() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => fetchUnreadCount(userId).then(setUnread).catch(() => {});
    refresh();
    const unsub = subscribeToNotifications(userId, refresh);
    return unsub;
  }, [userId]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <Logo className="text-2xl" />
        <div className="flex items-center gap-1">
          <Link to="/explore" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Search">
            <Search className="h-5 w-5" />
          </Link>
          <Link to="/notifications" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Notifications">
            <span className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-glow-sm">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
          </Link>
          <Link to="/messages" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Messages">
            <MessageCircle className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}