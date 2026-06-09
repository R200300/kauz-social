import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  return <ProfileView profileId={user.id} isOwn={true} />;
