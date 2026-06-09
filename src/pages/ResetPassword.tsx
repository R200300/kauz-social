import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/Spinner";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase sets a recovery session from the link's hash; wait for it.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/feed"), 1500);
  };

  return (
    <div className="min-h-[100svh] bg-background px-6 pb-10 pt-6">
      <div className="mx-auto mt-10 max-w-sm">
        <Logo className="text-3xl" />
        <h1 className="mt-6 font-display text-3xl font-bold">New password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a strong new password.</p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm">Password updated! Taking you to your feed…</p>
          </div>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type={show ? "text" : "password"} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <button type="button" onClick={() => setShow(!show)} aria-label="Toggle password">
                {show ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type={show ? "text" : "password"} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {!ready && (
              <p className="text-xs text-muted-foreground">
                Open this page from the reset link in your email to continue.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !ready}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-60"
            >
              {loading && <Spinner size={16} />}
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
