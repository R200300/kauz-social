import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchProfileByUsername, type ProfileRow } from "@/lib/profiles";
import { ProfileView } from "@/components/ProfileView";
import { Spinner } from "@/components/Spinner";


export default function UserProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProfileByUsername(username)
      .then((p) => active && setProfile(p))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <Spinner size={32} />
      </div>
    );
  }
  if (!profile) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Profile not found.</p>;
  }

  const isOwn = user?.id === profile.id;
  return <ProfileView profileId={profile.id} isOwn={isOwn} />;
}