import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LogOut, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="mx-auto max-w-md flex flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-lg font-bold">Settings</h1>
      </div>

      <div className="flex-1 space-y-2 p-4 pb-20">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          <span className="text-sm font-semibold">Sign out</span>
        </button>
      </div>
    </div>
  );
}