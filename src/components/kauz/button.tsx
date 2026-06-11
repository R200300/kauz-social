import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold transition duration-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/60 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "kauz-gradient text-white shadow-[0_14px_44px_rgba(124,58,237,0.45)] hover:scale-[1.01]",
  secondary: "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
  ghost: "text-white/72 hover:bg-white/[0.07] hover:text-white",
};

type Variant = keyof typeof variants;

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  className = "",
  variant = "primary",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}
