import { Link } from "react-router-dom";
import { Heart, MessageCircle, Search, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center">
          <Logo className="text-2xl" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/explore"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Search"
          >
            <Search size={20} />
          </Link>
          <Link
            to="/notifications"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Notifications"
          >
            <Heart size={20} />
          </Link>
          <Link
            to="/messages"
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Messages"
          >
            <MessageCircle size={20} />
          </Link>
          {user && (
            <Link
              to="/settings"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Settings"
            >
              <Settings size={20} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}