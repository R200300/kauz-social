import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="font-display text-6xl font-bold text-primary">404</h1>
        <p className="text-lg font-semibold">Page not found</p>
        <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/feed"
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm"
        >
          <Home className="h-4 w-4" />
          Go to Feed
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    </div>
  );
}
