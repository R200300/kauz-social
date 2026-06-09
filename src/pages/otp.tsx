import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/Spinner";

export default function OTP() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (i: number, v: string) => {
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    setError("");
    const token = code.join("");
    if (token.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    if (!email) {
      setError("Missing email. Please sign up again.");
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    setLoading(false);

    if (verifyError) {
      setError("Invalid or expired code. Please try again.");
      return;
    }
    navigate("/feed", { replace: true });
  };

  const handleResend = async () => {
    if (!email) return;
    setResent(false);
    await supabase.auth.resend({ type: "signup", email });
    setResent(true);
  };

  return (
    <div className="min-h-[100svh] bg-background px-6 pb-10 pt-6">
      <Link to="/signup" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="mx-auto mt-6 max-w-sm">
        <h1 className="font-display text-3xl font-bold">Verify your email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to {email ? <span className="text-foreground">{email}</span> : "your inbox"}.
        </p>

        <div className="mt-8 flex justify-between gap-2">
          {code.map((v, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              inputMode="numeric"
              maxLength={1}
              value={v}
              onChange={(e) => update(i, e.target.value)}
              className="h-14 w-12 rounded-2xl border border-border bg-surface text-center text-xl font-semibold outline-none focus:border-primary focus:shadow-glow-sm"
            />
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-60"
        >
          {loading && <Spinner size={16} />}
          {loading ? "Verifying..." : "Verify"}
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {resent ? "Code resent! " : "Didn't get it? "}
          <button onClick={handleResend} className="text-primary">Resend</button>
        </p>
      </div>
    </div>
  );
}