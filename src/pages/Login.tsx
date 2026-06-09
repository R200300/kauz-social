import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/Spinner";

function SocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-sm font-medium hover:bg-surface-elevated"
    >
      {icon}
      {label}
    </button>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError("Invalid email or password");
      return;
    }
    navigate("/feed");
  };

  const oauth = async (provider: "google" | "apple") => {
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/feed` },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="min-h-[100svh] bg-background px-6 pb-10 pt-6">
      <Link to="/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="mx-auto mt-6 max-w-sm">
        <Logo className="text-3xl" />
        <h1 className="mt-6 font-display text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to your Kauz account.</p>

        <form className="mt-8 space-y-3" onSubmit={handleLogin}>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password">
              {show ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary">Forgot password?</Link>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-60"
          >
            {loading && <Spinner size={16} />}
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or continue with <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          <SocialButton
            label="Continue with Google"
            onClick={() => oauth("google")}
            icon={
              <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.3-.9 2.4-2 3.1v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"/><path fill="#fff" opacity=".7" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6C4.7 19.8 8.1 22 12 22z"/></svg>
            }
          />
          <SocialButton
            label="Continue with Apple"
            onClick={() => oauth("apple")}
            icon={<svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M16.4 1.5c0 1.2-.5 2.3-1.3 3.1-.8.9-2.1 1.5-3.2 1.4-.1-1.2.5-2.4 1.2-3.1.8-.9 2.1-1.5 3.3-1.4zm4.4 16.5c-.6 1.4-.9 2-1.7 3.2-1.1 1.7-2.7 3.8-4.6 3.8-1.7 0-2.2-1.1-4.5-1.1s-2.8 1.1-4.5 1.1c-1.9 0-3.4-1.9-4.5-3.6C-.6 16.5-1 11 1.6 8c1.9-2.2 4.9-2.6 6.5-1.6 1.4.8 2.3.8 3.7 0 1.9-1 4.4-1 6.3 1-5.6 3.1-4.6 11 2.7 10.6z"/></svg>}
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to Kauz? <Link to="/signup" className="text-primary">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
