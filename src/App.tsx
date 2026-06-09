import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { Spinner } from "@/components/Spinner";
import { touchLastSeen } from "@/lib/messages";
import { useEffect } from "react";

// Pages
import Splash from "@/pages/Splash";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import OTP from "@/pages/OTP";
import Reels from "@/pages/Reels";
import Feed from "@/pages/Feed";
import Explore from "@/pages/Explore";
import Create from "@/pages/Create";
import Messages from "@/pages/Messages";
import Chat from "@/pages/Chat";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Settings from "@/pages/Settings";
import UserProfile from "@/pages/UserProfile";
import NotFound from "@/pages/NotFound";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { session, loading, user } = useAuth();

  // Online status: stamp last_seen now and every 2 minutes while active.
  useEffect(() => {
    if (!user) return;
    touchLastSeen(user.id).catch(() => {});
    const interval = setInterval(() => touchLastSeen(user.id).catch(() => {}), 120_000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-background">
        <Spinner size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100svh] bg-background pb-24">
      {children}
      <BottomNav />
      <Toaster position="top-center" />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/otp" element={<OTP />} />

      {/* Reels - standalone full-screen */}
      <Route path="/reels" element={<Reels />} />

      {/* Messages chat - standalone */}
      <Route path="/messages/:id" element={<Chat />} />

      {/* Protected routes with bottom nav */}
      <Route
        path="/feed"
        element={
          <ProtectedLayout>
            <Feed />
          </ProtectedLayout>
        }
      />
      <Route
        path="/explore"
        element={
          <ProtectedLayout>
            <Explore />
          </ProtectedLayout>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedLayout>
            <Create />
          </ProtectedLayout>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedLayout>
            <Messages />
          </ProtectedLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedLayout>
            <Notifications />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedLayout>
            <EditProfile />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        }
      />
      <Route
        path="/u/:username"
        element={
          <ProtectedLayout>
            <UserProfile />
          </ProtectedLayout>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
