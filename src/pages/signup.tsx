import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, AtSign, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/Spinner";

function Field({
  icon,
  ...props
}: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:border-primary">
      <span className="text-muted-foreground">{icon}</span>
      <input {...props} className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName || !username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/feed`,
        data: { full_name: fullName, username },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required, no session is returned yet.
    if (data.session) {
      navigate("/feed", { replace: true });
    } else {
      navigate(`/otp?email=${encodeURIComponent(email)}`, { replace: true });
    }
  };

  return (
    <div className="min-h-[100svh] bg-background px-6 pb-10 pt-6">
      <Link to="/" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="mx-auto mt-6 max-w-sm">
        <Logo className="text-3xl" />
        <h1 className="mt-6 font-display text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Join the AI-powered social wave.</p>

        <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
          <Field icon={<User className="h-4 w-4" />} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Field icon={<AtSign className="h-4 w-4" />} placeholder="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} />
          <Field icon={<Mail className="h-4 w-4" />} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field icon={<Lock className="h-4 w-4" />} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-60"
          >
            {loading && <Spinner size={16} />}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing up you agree to Kauz's Terms & Privacy Policy.
        </p>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary">Log in</Link>
        </p>
      </div>
    </div>
  );
}