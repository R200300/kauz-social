import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ChevronRight, User, Lock, Bell, Sparkles, Moon, LogOut, ShieldCheck, HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-gradient-primary shadow-glow-sm" : "bg-muted"}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function Row({
  icon, label, action, danger,
}: { icon: React.ReactNode; label: string; action?: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${danger ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
        {icon}
      </span>
      <span className={`flex-1 text-sm ${danger ? "font-semibold text-destructive" : ""}`}>{label}</span>
      {action ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [notif, setNotif] = useState(true);
  const [aiPref, setAiPref] = useState(true);
  const [dark, setDark] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-xl">
        <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Settings</h1>
      </header>

      <div className="space-y-5 p-4">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <p className="px-4 pt-3 text-xs uppercase tracking-wide text-muted-foreground">Account</p>
          <Link to="/edit-profile" className="block">
            <Row icon={<User className="h-4 w-4" />} label="Edit profile" />
          </Link>
          <Row icon={<Lock className="h-4 w-4" />} label="Privacy & Security" />
          <Row icon={<ShieldCheck className="h-4 w-4" />} label="Blocked accounts" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <p className="px-4 pt-3 text-xs uppercase tracking-wide text-muted-foreground">Preferences</p>
          <Row icon={<Bell className="h-4 w-4" />} label="Push notifications" action={<Toggle on={notif} onChange={setNotif} />} />
          <Row icon={<Sparkles className="h-4 w-4" />} label="AI personalization" action={<Toggle on={aiPref} onChange={setAiPref} />} />
          <Row icon={<Moon className="h-4 w-4" />} label="Dark mode" action={<Toggle on={dark} onChange={setDark} />} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <p className="px-4 pt-3 text-xs uppercase tracking-wide text-muted-foreground">Support</p>
          <Row icon={<HelpCircle className="h-4 w-4" />} label="Help center" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <button onClick={handleLogout} className="w-full text-left">
            <Row icon={<LogOut className="h-4 w-4" />} label="Log out" danger action={<span />} />
          </button>
        </section>

        <p className="pt-2 text-center text-xs text-muted-foreground">Kauz v1.0 · Made with ✨</p>
      </div>
    </div>
  );
}
