import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({
  icon,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-white/70 transition focus-within:border-fuchsia-300/50 focus-within:bg-white/[0.08]">
      {icon ? <span className="text-white/45">{icon}</span> : null}
      <input
        className={`w-full bg-transparent text-sm text-white outline-none placeholder:text-white/36 ${className}`}
        {...props}
      />
    </label>
  );
}
