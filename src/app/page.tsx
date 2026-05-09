import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Socialella — Promote your apps. Sustainably.",
  description:
    "Socialella is the social media co-pilot for solo founders. Compose once, tailor for every platform, and publish without the chaos.",
};

/* ------------------------------------------------------------------ */
/* Brand surface — landing-only violet/pink palette, applied via a   */
/* wrapper so the rest of the app keeps its indigo identity.          */
/* ------------------------------------------------------------------ */

function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-white text-[var(--gray-900)] antialiased"
      style={
        {
          // Override the app's accent locally so buttons/links render violet.
          ["--color-accent" as string]: "var(--violet-600)",
          ["--color-accent-hover" as string]: "var(--violet-700)",
          ["--color-accent-soft" as string]: "var(--violet-50)",
          ["--color-accent-soft-text" as string]: "var(--violet-700)",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Wordmark                                                            */
/* ------------------------------------------------------------------ */

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-1.5 text-[var(--gray-900)]",
        className,
      )}
    >
      <span className="text-lg font-semibold tracking-tight">socialella</span>
      <Icon
        name="Heart"
        weight="fill"
        className="h-3.5 w-3.5 text-[var(--pink-500)]"
        aria-hidden
      />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Top nav                                                             */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-founders", label: "For founders" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#pricing", label: "Pricing" },
];

function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--gray-150)] bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Wordmark />
        <ul className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium text-[var(--gray-700)] transition-colors hover:text-[var(--violet-700)]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3.5 text-sm font-medium text-[var(--gray-800)] transition-colors hover:bg-[var(--gray-50)] sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--violet-600)] px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--violet-700)]"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* very soft pink/violet glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 360px at 12% 0%, var(--pink-50) 0%, transparent 60%), radial-gradient(900px 420px at 100% 10%, var(--violet-50) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6 lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pt-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--pink-100)] px-3 py-1 text-xs font-medium text-[var(--pink-600)]">
            <Icon name="Heart" weight="fill" className="h-3 w-3" aria-hidden />
            Built for indie founders{" "}
            <span className="font-semibold">(especially women)</span>
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-[var(--gray-900)] sm:text-5xl lg:text-[58px]">
            Promote your apps.{" "}
            <span className="text-[var(--violet-600)]">Sustainably.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--gray-600)] sm:text-lg">
            Socialella is the social media co-pilot for solo founders. Compose
            once, tailor for every platform, and publish without the chaos.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--violet-600)] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.7)] transition-colors hover:bg-[var(--violet-700)]"
            >
              Sign in to start
              <Icon name="ArrowRight" className="h-4 w-4" weight="bold" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-5 text-sm font-semibold text-[var(--gray-800)] transition-colors hover:border-[var(--gray-300)]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--violet-50)] text-[var(--violet-600)]">
                <Icon name="Play" weight="fill" className="h-3 w-3" />
              </span>
              See how it works
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--gray-600)]">
            {[
              { icon: "CheckCircle" as IconName, label: "No credit card" },
              { icon: "Hand" as IconName, label: "Hand-off mode" },
              { icon: "Heart" as IconName, label: "Always free core" },
            ].map((s) => (
              <li key={s.label} className="inline-flex items-center gap-1.5">
                <Icon
                  name={s.icon}
                  weight="fill"
                  className="h-3.5 w-3.5 text-[var(--violet-500)]"
                />
                {s.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 lg:mt-0">
          <HeroProductPreview />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Hero product preview — simplified app screenshot                    */
/* ------------------------------------------------------------------ */

function HeroProductPreview() {
  const sidebarApps = [
    { name: "Acme Tracker", color: "var(--violet-500)", active: true },
    { name: "Feel Perfect", color: "var(--pink-400)" },
    { name: "ScanSnap", color: "#34d399" },
  ];
  const sidebarLinks = [
    { name: "Dashboard", icon: "SquaresFour" as IconName },
    { name: "Queue", icon: "CalendarBlank" as IconName, badge: "3" },
    { name: "Calendar", icon: "CalendarBlank" as IconName },
    { name: "Campaigns", icon: "RocketLaunch" as IconName },
    { name: "Evergreen", icon: "ArrowsClockwise" as IconName },
    { name: "Insights", icon: "ChartLineUp" as IconName },
    { name: "Settings", icon: "Gear" as IconName },
  ];
  const platforms = [
    { name: "X (Twitter)", icon: "XLogo" as IconName, active: true },
    { name: "LinkedIn", icon: "LinkedinLogo" as IconName },
    { name: "Instagram", icon: "Sparkle" as IconName },
    { name: "TikTok", icon: "Waveform" as IconName },
  ];

  return (
    <div
      className="relative rounded-2xl border border-[var(--gray-200)] bg-white shadow-[0_30px_80px_-30px_rgba(76,29,149,0.25)]"
      aria-hidden
    >
      <div className="grid grid-cols-[160px_1fr] overflow-hidden rounded-2xl">
        {/* Sidebar */}
        <aside className="flex flex-col gap-1 border-r border-[var(--gray-150)] bg-[var(--gray-50)] p-3">
          <div className="mb-2 flex items-center justify-between rounded-md bg-white px-2 py-1.5">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-800)]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--violet-500)" }}
              />
              Acme Tracker
            </span>
            <Icon
              name="CaretDown"
              className="h-3 w-3 text-[var(--gray-400)]"
            />
          </div>
          <button
            type="button"
            className="mb-2 flex h-8 items-center justify-center gap-1 rounded-md bg-[var(--violet-600)] text-[10px] font-semibold text-white"
          >
            <Icon name="Plus" weight="bold" className="h-3 w-3" />
            New post
          </button>
          {sidebarApps.map((a) => (
            <div
              key={a.name}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px]",
                a.active
                  ? "bg-[var(--violet-50)] font-medium text-[var(--violet-700)]"
                  : "text-[var(--gray-600)]",
              )}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: a.color }}
              />
              {a.name}
            </div>
          ))}
          <div className="px-2 py-1 text-[10px] text-[var(--gray-400)]">
            + Add another app
          </div>
          <div className="mt-3 space-y-0.5">
            {sidebarLinks.map((l) => (
              <div
                key={l.name}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-[var(--gray-600)]"
              >
                <span className="flex items-center gap-1.5">
                  <Icon name={l.icon} className="h-3 w-3" />
                  {l.name}
                </span>
                {l.badge && (
                  <span className="rounded-full bg-[var(--violet-100)] px-1.5 text-[9px] font-semibold text-[var(--violet-700)]">
                    {l.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--gray-900)]">
              Compose
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gray-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--gray-700)]">
              Confidence: <span className="text-emerald-600">High</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="text-[10px] text-[var(--gray-500)]">
            One step, tailored for every platform
          </p>

          <div className="mt-3 flex items-center gap-1.5 border-b border-[var(--gray-150)] pb-2">
            {platforms.map((p) => (
              <span
                key={p.name}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium",
                  p.active
                    ? "border-[var(--violet-200)] bg-[var(--violet-50)] text-[var(--violet-700)]"
                    : "border-[var(--gray-200)] bg-white text-[var(--gray-600)]",
                )}
              >
                <Icon name={p.icon} className="h-2.5 w-2.5" />
                {p.name}
              </span>
            ))}
            <span className="ml-auto text-[10px] font-medium text-[var(--violet-600)]">
              + More
            </span>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_72px] gap-3">
            <div className="space-y-1.5 text-[11px] leading-snug text-[var(--gray-700)]">
              <p className="font-medium text-[var(--gray-900)]">
                Ship progress &gt; perfection.
              </p>
              <p>
                Just launched a new time tracking feature in Acme Tracker.
              </p>
              <p>
                Try it free →{" "}
                <span className="text-[var(--violet-600)] underline">
                  acme.com
                </span>
              </p>
              <p>
                What&apos;s the one feature you wish more tools had?
              </p>
            </div>
            <div className="aspect-[9/16] rounded-md border border-[var(--gray-200)] bg-gradient-to-b from-[var(--violet-50)] to-white p-1.5">
              <div className="h-full w-full rounded-sm bg-white shadow-inner" />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[var(--gray-400)]">
            <Icon name="PaintBrush" className="h-3 w-3" />
            <Icon name="Sparkle" className="h-3 w-3" />
            <span className="text-[9px] tabular-nums">
              130 / 280
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-[var(--gray-50)] p-2 text-[10px]">
            <div>
              <p className="font-medium text-[var(--gray-700)]">
                Add to queue
              </p>
              <p className="text-[var(--gray-500)]">
                Tomorrow 10:00 AM
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-md bg-[var(--violet-600)] px-2 text-[10px] font-semibold text-white"
            >
              <Icon name="Copy" className="h-2.5 w-2.5" />
              Copy &amp; open
              <Icon name="XLogo" className="h-2.5 w-2.5" />
            </button>
          </div>

          <p className="mt-2 text-[10px] italic text-[var(--gray-500)]">
            Hand-off mode: We copy and open. You post.{" "}
            <Icon
              name="Hand"
              weight="fill"
              className="inline h-2.5 w-2.5 text-[var(--violet-500)]"
            />
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6-feature strip                                                     */
/* ------------------------------------------------------------------ */

const FEATURES_STRIP: {
  icon: IconName;
  title: string;
  body: string;
  tint: string;
}[] = [
  {
    icon: "SquaresFour",
    title: "Apps as channels",
    body: "Everything organized by the apps you build.",
    tint: "var(--violet-100)",
  },
  {
    icon: "ShieldCheck",
    title: "Confidence pass",
    body: "Catch tone slips before you hit post.",
    tint: "var(--pink-100)",
  },
  {
    icon: "ClipboardText",
    title: "Founder checklist",
    body: "Never ship a half-baked promotion again.",
    tint: "#fef3c7",
  },
  {
    icon: "ArrowsClockwise",
    title: "Evergreen recycle",
    body: "Your best content, on autopilot.",
    tint: "#dcfce7",
  },
  {
    icon: "Lightning",
    title: "Energy-aware",
    body: "Schedule around your energy, not just algorithms.",
    tint: "#cffafe",
  },
  {
    icon: "Heart",
    title: "Safety kit",
    body: "Quick-capture & reporter links when you need them.",
    tint: "var(--pink-100)",
  },
];

function FeatureStrip() {
  return (
    <section
      id="features"
      className="border-y border-[var(--gray-150)] bg-[var(--gray-50)]/50"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-6 lg:gap-3 lg:px-8">
        {FEATURES_STRIP.map((f) => (
          <div key={f.title} className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ background: f.tint }}
            >
              <Icon
                name={f.icon}
                weight="fill"
                className="h-4 w-4 text-[var(--gray-800)]"
              />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--gray-900)]">
                {f.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--gray-600)]">
                {f.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Made for indie founders gallery                                     */
/* ------------------------------------------------------------------ */

const FOUNDER_CARDS: {
  title: string;
  body: string;
  visual: React.ReactNode;
}[] = [
  {
    title: "Batch compose",
    body: "Write 10 posts in 15 minutes. Reclaim your day.",
    visual: (
      <div className="flex h-24 items-center justify-center bg-[var(--violet-50)]">
        <Icon
          name="Timer"
          weight="duotone"
          className="h-12 w-12 text-[var(--violet-600)]"
        />
      </div>
    ),
  },
  {
    title: "Tone per-platform",
    body: "See how your message lands everywhere.",
    visual: (
      <div className="flex h-24 items-center justify-center gap-1.5 bg-[var(--pink-50)] px-4">
        {(["XLogo", "LinkedinLogo", "Sparkle"] as IconName[]).map((n) => (
          <span
            key={n}
            className="flex h-12 w-9 items-center justify-center rounded-md border border-[var(--gray-200)] bg-white"
          >
            <Icon name={n} className="h-4 w-4 text-[var(--gray-700)]" />
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Founder promo checklist",
    body: "Pricing? CTA? Link? Alt text? We've got you.",
    visual: (
      <div className="flex h-24 flex-col justify-center gap-1 bg-amber-50 px-5">
        {["Pricing mentioned", "Clear CTA", "Alt text"].map((t) => (
          <span
            key={t}
            className="flex items-center gap-1.5 text-[10px] text-[var(--gray-700)]"
          >
            <Icon
              name="CheckCircle"
              weight="fill"
              className="h-3 w-3 text-[var(--violet-600)]"
            />
            {t}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Campaigns that convert",
    body: "Bundle posts, track goals, ship launches.",
    visual: (
      <div className="flex h-24 items-end justify-center gap-1 bg-[var(--violet-50)] px-6 pb-3">
        {[28, 44, 36, 56, 48, 70, 62].map((h, i) => (
          <span
            key={i}
            className="w-3 rounded-sm bg-[var(--violet-500)]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    ),
  },
  {
    title: "Decision-first dashboard",
    body: "What changed, what's next, what to do today.",
    visual: (
      <div className="flex h-24 items-center justify-center gap-1.5 bg-emerald-50 px-3">
        <span className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-white shadow-sm">
          <span className="text-[8px] font-medium text-[var(--gray-500)]">
            SHIPPED
          </span>
          <span className="text-sm font-bold text-[var(--gray-900)]">24</span>
        </span>
        <span className="flex h-12 w-12 flex-col items-center justify-center rounded-md bg-white shadow-sm">
          <span className="text-[8px] font-medium text-[var(--gray-500)]">
            READY
          </span>
          <span className="text-sm font-bold text-[var(--gray-900)]">3</span>
        </span>
      </div>
    ),
  },
];

function FounderGallery() {
  return (
    <section id="for-founders" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--gray-900)] sm:text-4xl">
            Made for indie founders
          </h2>
          <p className="mt-3 text-base text-[var(--gray-600)]">
            You build the apps. We help you share them without burning out.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FOUNDER_CARDS.map((c) => (
            <article
              key={c.title}
              className="overflow-hidden rounded-xl border border-[var(--gray-200)] bg-white transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              {c.visual}
              <div className="border-t border-[var(--gray-150)] p-4">
                <p className="text-sm font-semibold text-[var(--gray-900)]">
                  {c.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--gray-600)]">
                  {c.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works — 4 numbered steps                                     */
/* ------------------------------------------------------------------ */

const STEPS: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Compose once",
    body: "Write your post idea in one place.",
    icon: "PencilSimple",
  },
  {
    title: "We tailor for each platform",
    body: "Optimized tone, length, and format.",
    icon: "ShareNetwork",
  },
  {
    title: "One tap to hand-off",
    body: "We copy your content and open the right composer.",
    icon: "Copy",
  },
  {
    title: "You post with confidence",
    body: "Because you're in control, always.",
    icon: "PaperPlaneTilt",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-[var(--gray-150)] bg-[var(--gray-50)]/50 py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--gray-900)] sm:text-4xl">
            How Socialella works{" "}
            <span className="text-[var(--violet-600)]">(hand-off mode)</span>
          </h2>
        </div>
        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              {i < STEPS.length - 1 && (
                <div
                  aria-hidden
                  className="absolute left-1/2 top-7 hidden h-px w-full bg-[var(--gray-200)] lg:block"
                />
              )}
              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pink-200)] text-xs font-bold text-[var(--pink-600)]">
                  {i + 1}
                </span>
                <span className="mt-3 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--gray-200)] bg-white shadow-sm">
                  <Icon
                    name={s.icon}
                    weight="duotone"
                    className="h-5 w-5 text-[var(--violet-600)]"
                  />
                </span>
                <p className="mt-3 text-sm font-semibold text-[var(--gray-900)]">
                  {s.title}
                </p>
                <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-[var(--gray-600)]">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Everything you need — checklist                                     */
/* ------------------------------------------------------------------ */

const CHECKLIST = [
  "Apps as channels",
  "Campaigns per app",
  "Confidence pass",
  "Founder checklist",
  "Evergreen recycle",
  "Batch compose",
  "Tone per-platform preview",
  "Energy-aware scheduling",
  "Safety kit",
  "Insights & what changed",
  "Queue & calendar",
  "And more…",
];

function Checklist() {
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--gray-900)] sm:text-3xl">
            Everything you need.{" "}
            <span className="block">Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--gray-600)]">
            Socialella gives you the right tools to market your apps — without
            the noise, bloat, or burnout.
          </p>
          <a
            href="#features"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--violet-600)] hover:underline"
          >
            See all features →
          </a>
        </div>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKLIST.map((c) => (
            <li
              key={c}
              className="flex items-center gap-2 text-sm text-[var(--gray-700)]"
            >
              <Icon
                name="CheckCircle"
                weight="fill"
                className="h-4 w-4 shrink-0 text-[var(--violet-600)]"
              />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom CTA                                                          */
/* ------------------------------------------------------------------ */

function BottomCTA() {
  return (
    <section id="roadmap" className="px-4 pb-16 sm:px-6 lg:px-8">
      <div
        className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-2xl border border-[var(--pink-200)] px-6 py-10 sm:flex-row sm:gap-8 sm:px-10"
        style={{
          background:
            "linear-gradient(135deg, var(--pink-50) 0%, var(--violet-50) 100%)",
        }}
      >
        <div
          aria-hidden
          className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <Icon
            name="Sparkle"
            weight="duotone"
            className="h-16 w-16 text-[var(--violet-600)]"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--gray-900)] sm:text-3xl">
            Your apps deserve to be seen.
            <span className="block text-[var(--violet-600)]">
              You deserve to breathe.
            </span>
          </h2>
          <p className="mt-2 text-sm text-[var(--gray-700)]">
            Join thousands of indie founders using Socialella to market
            smarter, not harder.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:items-end">
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--violet-600)] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.7)] transition-colors hover:bg-[var(--violet-700)]"
          >
            Sign in to start
            <Icon name="ArrowRight" weight="bold" className="h-4 w-4" />
          </Link>
          <p className="inline-flex items-center gap-1 text-[11px] text-[var(--gray-600)]">
            <Icon
              name="Heart"
              weight="fill"
              className="h-3 w-3 text-[var(--pink-500)]"
            />
            No credit card. Always free core.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-[var(--gray-150)] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Wordmark />
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--gray-600)]">
          {[...NAV_LINKS, { href: "#changelog", label: "Changelog" }].map(
            (l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="transition-colors hover:text-[var(--violet-700)]"
                >
                  {l.label}
                </a>
              </li>
            ),
          )}
        </ul>
        <div className="flex items-center gap-3 text-[var(--gray-500)]">
          {(["DiscordLogo", "GithubLogo", "XLogo"] as IconName[]).map((n) => (
            <a
              key={n}
              href="#"
              className="transition-colors hover:text-[var(--violet-700)]"
              aria-label={n.replace("Logo", "")}
            >
              <Icon name={n} className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <LandingShell>
      <TopNav />
      <main>
        <Hero />
        <FeatureStrip />
        <FounderGallery />
        <HowItWorks />
        <Checklist />
        <BottomCTA />
      </main>
      <Footer />
    </LandingShell>
  );
}
