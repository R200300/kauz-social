import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export default function Splash() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate("/feed", { replace: true });
    }
  }, [loading, session, navigate]);

  return (
    <div className="relative flex min-h-[100svh] flex-col items-center justify-between overflow-hidden bg-background px-6 py-12">
      <div className="bg-gradient-radial pointer-events-none absolute inset-x-0 top-0 h-[70vh]" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-[120px]" />

      <div className="flex-1" />

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-8">
          <div className="animate-pulse-glow grid h-28 w-28 place-items-center rounded-[2rem] bg-gradient-primary">
            <Logo className="text-5xl" />
          </div>
        </div>
        <h1 className="font-display text-4xl font-bold">Your World.</h1>
        <h1 className="font-display text-4xl font-bold text-gradient">Your Cause.</h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          A social network powered by AI — built for creators, communities and causes that matter.
        </p>
      </div>

      <div className="flex-1" />

      <div className="w-full max-w-sm space-y-3">
        <Link
          to="/signup"
          className="block w-full rounded-2xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Get Started
        </Link>
        <Link
          to="/login"
          className="block w-full rounded-2xl border border-border bg-surface py-3.5 text-center text-sm font-semibold hover:bg-surface-elevated"
        >
          Log In
        </Link>
        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          By continuing you agree to our Terms & Privacy.
        </p>
      </div>
    </div>
  );
}