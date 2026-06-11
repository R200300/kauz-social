import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="Kauz home">
      <span className="kauz-gradient grid h-11 w-11 place-items-center rounded-2xl text-xl font-black text-white shadow-[0_0_34px_rgba(124,58,237,0.65)]">
        K
      </span>
      <span className="text-2xl font-black tracking-[-0.08em] text-white">kauz</span>
    </Link>
  );
}

export function GlowOrb() {
  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-20 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-28 top-1/3 -z-10 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-[110px]" />
      <div className="pointer-events-none absolute -left-32 bottom-20 -z-10 h-64 w-64 rounded-full bg-lime-300/10 blur-[100px]" />
    </>
  );
}
