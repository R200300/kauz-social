import { ArrowRight, BadgeCheck, HeartHandshake, Sparkles, UsersRound } from "lucide-react";
import { BrandMark, GlowOrb } from "@/components/kauz/brand";
import { ButtonLink } from "@/components/kauz/button";

const stats = [
  ["42K", "cause circles"],
  ["1.8M", "support actions"],
  ["24/7", "community signal"],
];

const featureCards = [
  {
    icon: HeartHandshake,
    label: "Cause-first posting",
    copy: "Every post can turn attention into measurable support.",
  },
  {
    icon: UsersRound,
    label: "Trusted circles",
    copy: "Follow creators, nonprofits, and friends moving the same mission.",
  },
  {
    icon: Sparkles,
    label: "AI-ready momentum",
    copy: "A foundation for smarter captions, discovery, and campaign insights.",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
      <GlowOrb />
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <BrandMark />
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" className="min-h-11 px-4">
            Get started
          </ButtonLink>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 pb-12 pt-16 lg:grid-cols-[1fr_0.82fr] lg:pb-20 lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/68">
            <BadgeCheck className="h-4 w-4 text-lime-300" /> social impact starts here
          </div>
          <h1 className="mt-7 max-w-4xl text-6xl font-black leading-[0.84] tracking-[-0.085em] text-white sm:text-7xl lg:text-8xl">
            Your world. <span className="gradient-text">Your cause.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">
            Kauz is a mobile-first social home for creators, communities, and nonprofits to tell
            stories, gather support, and move real-world missions forward.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/signup" className="gap-2">
              Create your Kauz <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary">
              I already have an account
            </ButtonLink>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {stats.map(([value, label]) => (
              <div key={label} className="glass-panel rounded-3xl p-4">
                <div className="text-2xl font-black tracking-[-0.05em] text-white">{value}</div>
                <div className="mt-1 text-xs text-white/45">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="phone-shell mx-auto w-full max-w-[390px] rounded-[3rem] p-3">
          <div className="rounded-[2.35rem] bg-[#090812] p-4">
            <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-white/16" />
            <div className="flex items-center justify-between">
              <BrandMark className="scale-75 origin-left" />
              <span className="rounded-full bg-lime-300/15 px-3 py-1 text-xs font-bold text-lime-200">
                Live
              </span>
            </div>
            <div className="mt-6 rounded-[2rem] bg-white/[0.06] p-4">
              <div className="h-48 rounded-[1.5rem] bg-gradient-to-br from-fuchsia-400 via-purple-600 to-indigo-950 p-4">
                <div className="inline-flex rounded-full bg-black/24 px-3 py-1 text-xs font-bold text-white">
                  Clean Water Fund
                </div>
                <p className="mt-20 text-2xl font-black leading-none tracking-[-0.06em]">
                  14 filters funded today
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/68">
                Maya's circle is 72% of the way to a school filtration kit.
              </p>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div className="h-2 w-[72%] rounded-full bg-lime-300" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/55">
              <span className="rounded-2xl bg-white/[0.06] py-3">Support</span>
              <span className="rounded-2xl bg-white/[0.06] py-3">Share</span>
              <span className="rounded-2xl bg-white/[0.06] py-3">Join</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 pb-12 md:grid-cols-3">
        {featureCards.map(({ icon: Icon, label, copy }) => (
          <article key={label} className="glass-panel rounded-[2rem] p-6">
            <Icon className="h-6 w-6 text-fuchsia-300" />
            <h2 className="mt-5 text-xl font-black tracking-[-0.045em]">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
