import { createBrowserRouter } from "react-router-dom";

// Layout
import { MainLayout } from "./components/MainLayout";
import { RootLayout } from "./components/RootLayout";

// Pages
import Splash from "./pages/index";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import OTP from "./pages/otp";
import Reels from "./pages/reels";
import MessagesChat from "./pages/messages.id";

// Main app pages
import Feed from "./pages/main.feed";
import Explore from "./pages/main.explore";
import Create from "./pages/main.create";
import Messages from "./pages/main.messages";
import Notifications from "./pages/main.notifications";
import Profile from "./pages/main.profile";
import Settings from "./pages/main.settings";
import EditProfile from "./pages/main.edit-profile";
import UserProfile from "./pages/main.u.username";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Splash />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "signup",
        element: <Signup />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "reset-password",
        element: <ResetPassword />,
      },
      {
        path: "otp",
        element: <OTP />,
      },
      {
        path: "reels",
        element: <Reels />,
      },
      {
        path: "messages/:id",
        element: <MessagesChat />,
      },
      {
        element: <MainLayout />,
        children: [
          {
            path: "feed",
            element: <Feed />,
          },
          {
            path: "explore",
            element: <Explore />,
          },
          {
            path: "create",
            element: <Create />,
          },
          {
            path: "messages",
            element: <Messages />,
          },
          {
            path: "notifications",
            element: <Notifications />,
          },
          {
            path: "profile",
            element: <Profile />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
          {
            path: "edit-profile",
            element: <EditProfile />,
          },
          {
            path: "u/:username",
            element: <UserProfile />,
          },
        ],
      },
    ],
  },
]);

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This corner of Kauz doesn't exist yet.
        </p>
        <div className="mt-6">
          <a
            href="/feed"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm"
          >
            Go to feed
          </a>
        </div>
      </div>
    </div>
  );
}
