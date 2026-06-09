import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  fetchProfileById,
  updateProfile,
  uploadAvatar,
  type ProfileRow,
} from "@/lib/profiles";
import { Spinner } from "@/components/Spinner";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id ?? null;
  const fileInput = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchProfileById(userId)
      .then((p) => {
        if (!active || !p) return;
        setProfile(p);
        setFullName(p.full_name ?? "");
        setUsername(p.username ?? "");
        setBio(p.bio ?? "");
        setWebsite(p.website ?? "");
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function save() {
    if (!userId || saving) return;
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url ?? null;
      if (avatarFile) {
        avatar_url = await uploadAvatar(userId, avatarFile);
      }
      await updateProfile(userId, {
        full_name: fullName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        avatar_url,
      });
      toast.success("Profile updated ✨");
      navigate("/profile");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") toast.error("That username is already taken");
      else toast.error("Couldn't save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <Spinner size={32} />
      </div>
    );
  }

  const currentAvatar = avatarPreview || profile?.avatar_url || `https://i.pravatar.cc/200?u=${userId}`;

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-xl">
        <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-display text-lg font-semibold">Edit Profile</h1>
      </header>

      <div className="p-5">
        <div className="flex justify-center">
          <button onClick={() => fileInput.current?.click()} className="relative">
            <img
              src={currentAvatar}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-2 ring-primary shadow-glow-sm"
            />
            <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow-sm">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="input-base"
            />
          </Field>
          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="username"
              className="input-base"
            />
          </Field>
          <Field label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself"
              rows={3}
              className="input-base resize-none"
            />
          </Field>
          <Field label="Website">
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="input-base"
            />
          </Field>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow-sm disabled:opacity-50"
        >
          {saving ? <Spinner size={16} /> : "Save changes"}
        </button>
      </div>
    </div>
  );
}
