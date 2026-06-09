import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchNotifications } from "@/lib/notifications";
import { Spinner } from "@/components/Spinner";
import { Heart } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (user) {
          const data = await fetchNotifications(user.id);
          setNotifications(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md pb-20 pt-4">
      <div className="mb-4 flex items-center gap-2 px-4">
        <Heart size={24} />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No notifications yet
        </p>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className="border-b border-border px-4 py-3 hover:bg-muted"
            >
              <p className="text-sm">{notif.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}