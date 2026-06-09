import { NavLink, useLocation } from "react-router-dom";
import { Home, Compass, Plus, Clapperboard, Heart, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function BottomNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user-notifications:${user.id}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
      () => setUnread(true),
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-40">
      <div className="flex justify-around items-center h-16">
        <NavLink to="/" className={`p-2 flex items-center justify-center ${isActive('/') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Home size={24} />
        </NavLink>
        <NavLink to="/explore" className={`p-2 flex items-center justify-center ${isActive('/explore') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Compass size={24} />
        </NavLink>
        <NavLink to="/create" className={`p-2 flex items-center justify-center ${isActive('/create') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Plus size={24} />
        </NavLink>
        <NavLink to="/reels" className={`p-2 flex items-center justify-center ${isActive('/reels') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Clapperboard size={24} />
        </NavLink>
        <NavLink to="/notifications" className={`p-2 flex items-center justify-center relative ${isActive('/notifications') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <Heart size={24} />
          {unread && <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-1" />}
        </NavLink>
        <NavLink to="/messages" className={`p-2 flex items-center justify-center ${isActive('/messages') ? 'text-foreground' : 'text-muted-foreground'}`}>
          <MessageCircle size={24} />
        </NavLink>
      </div>
    </nav>
  );
}