import { useAuth } from "@/lib/auth";
import { ProfileView } from "@/components/ProfileView";
import { Spinner } from "@/components/Spinner";

export default function Profile() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <Spinner size={32} />
      </div>
    );
  }
  return <ProfileView profileId={user.id} isOwn />;
}
