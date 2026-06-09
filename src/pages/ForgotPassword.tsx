import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/Spinner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-[100svh] bg-background px-6 pb-10 pt-6">
      <Link to="/login" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="mx-auto mt-6 max-w-sm">
        <Logo className="text-3xl" />
        <h1 className="mt-6 font-display text-3xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm">
              If an account exists for <span className="text-foreground">{email}</span>, a reset link is on its way.
            </p>
            <Link to="/login" className="mt-5 inline-block rounded-2xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-60"
            >
              {loading && <Spinner size={16} />}
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
