import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function EmptyState({
  title = "No posts yet",
  description = "When you follow creators or post your first moment, you'll see it here.",
  ctaLabel = "Start exploring",
  ctaTo = "/explore",
}: {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: "/explore" | "/feed" | "/create";
}) {
  return (
    <div className="relative mx-auto flex max-w-sm flex-col items-center px-6 py-16 text-center">
      <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-[0.06]">
        <div className="scale-[3]">
          <Logo />
        </div>
      </div>
      <div className="relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-primary shadow-glow animate-pulse-glow">
        <Logo />
      </div>
      <h3 className="relative mt-5 font-display text-xl font-bold">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground">{description}</p>
      <Link
        to={ctaTo}
        className="relative mt-5 inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm tap-pulse"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}