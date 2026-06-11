"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { AuthShell } from "@/components/kauz/auth-shell";
import { Button } from "@/components/kauz/button";
import { Field } from "@/components/kauz/input";
import { auth, googleProvider } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!auth) {
      setError("Add Firebase environment variables to enable authentication.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    if (!auth) {
      setError("Add Firebase environment variables to enable Google sign-in.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your Kauz account and keep your cause in motion."
    >
      {!configured ? (
        <div className="mb-4 rounded-2xl border border-lime-300/20 bg-lime-300/10 p-3 text-xs leading-5 text-lime-100">
          Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* values from your Firebase
          project to enable live auth.
        </div>
      ) : null}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Field
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <div className="relative">
          <Field
            icon={<Lock className="h-4 w-4" />}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45"
            onClick={() => setShowPassword((value) => !value)}
            aria-label="Toggle password visibility"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error ? (
          <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
        ) : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/32">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>
      <Button className="w-full" variant="secondary" type="button" onClick={handleGoogle}>
        Continue with Google
      </Button>
      <p className="mt-6 text-center text-sm text-white/52">
        New to Kauz?{" "}
        <Link href="/signup" className="font-bold text-fuchsia-200">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
