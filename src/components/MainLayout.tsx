import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";
import { touchLastSeen } from "@/lib/messages";

export function MainLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      navigate("/login", { replace: true });
    }
  }, [loading, session, navigate]);

  // Online status: stamp last_seen now and every 2 minutes while active.
  useEffect(() => {
    if (!user) return;
    touchLastSeen(user.id).catch(() => {});
    const interval = setInterval(() => touchLastSeen(user.id).catch(() => {}), 120_000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading || !session) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-background">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background pb-24">
      <div key={pathname} className="animate-page-fade">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}