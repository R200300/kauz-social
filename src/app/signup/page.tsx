"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Lock, Mail, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { AuthShell } from "@/components/kauz/auth-shell";
import { Button } from "@/components/kauz/button";
import { Field } from "@/components/kauz/input";
import { auth, db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/firebase/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { configured } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!auth || !db) {
      setError("Add Firebase environment variables to enable signup and Firestore profiles.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: fullName });
      await setDoc(doc(db, "users", credential.user.uid), {
        fullName,
        username: username.replace(/^@/, "").toLowerCase(),
        email,
        createdAt: serverTimestamp(),
      });
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your Kauz"
      subtitle="Start a profile for the people, projects, and missions you care about."
    >
      {!configured ? (
        <div className="mb-4 rounded-2xl border border-lime-300/20 bg-lime-300/10 p-3 text-xs leading-5 text-lime-100">
          Firebase is not configured yet. Add NEXT_PUBLIC_FIREBASE_* environment variables to create
          live users.
        </div>
      ) : null}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Field
          icon={<UserRound className="h-4 w-4" />}
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Field
          icon={<AtSign className="h-4 w-4" />}
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s/g, ""))}
          required
        />
        <Field
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? (
          <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>
        ) : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs leading-5 text-white/42">
        By joining, you agree to use Kauz to build safe and authentic communities.
      </p>
      <p className="mt-6 text-center text-sm text-white/52">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-fuchsia-200">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
