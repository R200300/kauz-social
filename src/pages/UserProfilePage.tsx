import { useParams } from "react-router-dom";
import { ProfileView } from "@/components/ProfileView";
import { useAuth } from "@/lib/auth";

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  const isOwn = user?.id === userId;
  return <ProfileView profileId={userId!} isOwn={isOwn} />;
}