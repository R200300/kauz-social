import { Link, useLocation } from "react-router-dom";
import { Home, Compass, PlusSquare, Clapperboard, User } from "lucide-react";

const items = [
  { to: "/feed", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/create", icon: PlusSquare, label: "Create" },
  { to: "/reels", icon: Clapperboard, label: "Reels" },
  { to: "/profile", icon: User, label: "Profile" },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to;
          const isCreate = to === "/create";
          return (
            <li key={to}>
              <Link
                to={to}
                className="group tap-pulse flex flex-col items-center gap-1 px-3 py-1.5"
                aria-label={label}
              >
                {isCreate ? (
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-primary shadow-glow-sm transition-transform group-active:scale-95">
                    <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.4} />
                  </span>
                ) : (
                  <Icon
                    className={`h-6 w-6 transition-all duration-200 ${active ? "scale-110 text-primary drop-shadow-[0_0_8px_oklch(0.58_0.24_295/0.7)]" : "text-muted-foreground group-hover:text-foreground"}`}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                )}
                {!isCreate && (
                  <span
                    className={`h-[3px] rounded-full transition-all duration-300 ${active ? "w-5 bg-gradient-primary shadow-glow-sm" : "w-0 bg-transparent"}`}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}