import { BrandMark, GlowOrb } from "./brand";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-[100svh] overflow-hidden px-5 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
      <GlowOrb />
      <section className="hidden items-center justify-center lg:flex">
        <div className="max-w-xl">
          <BrandMark />
          <h1 className="mt-10 text-6xl font-black leading-[0.9] tracking-[-0.075em]">
            Rally people around <span className="gradient-text">what matters.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-white/60">
            Kauz blends social storytelling, authentic communities, and cause-driven momentum in one
            fast mobile-first home.
          </p>
        </div>
      </section>
      <section className="mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-8 flex justify-center lg:hidden">
          <BrandMark />
        </div>
        <div className="glass-panel rounded-[2rem] p-5 sm:p-7">
          <h1 className="text-3xl font-black tracking-[-0.055em] text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </section>
    </main>
  );
}
