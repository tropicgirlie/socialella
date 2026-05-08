import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CONNECTION_INFO,
  TIER_LABEL,
  type ConnectionInfo,
} from "@/lib/connection-status";

export const dynamic = "force-static";

const ACCENT_BG: Record<ConnectionInfo["accent"], string> = {
  rose: "var(--accent-rose-soft)",
  lemon: "var(--accent-lemon)",
  mint: "var(--accent-mint)",
  peach: "var(--accent-peach)",
  sky: "var(--accent-sky)",
};
const ACCENT_INK: Record<ConnectionInfo["accent"], string> = {
  rose: "var(--accent-rose-soft-ink)",
  lemon: "var(--accent-lemon-ink)",
  mint: "var(--accent-mint-ink)",
  peach: "var(--accent-peach-ink)",
  sky: "var(--accent-sky-ink)",
};

const TIER_TINT: Record<string, { bg: string; ink: string }> = {
  "free-credentials": {
    bg: "var(--accent-mint)",
    ink: "var(--accent-mint-ink)",
  },
  "free-review": { bg: "var(--accent-sky)", ink: "var(--accent-sky-ink)" },
  "paid-api": {
    bg: "var(--accent-rose-soft)",
    ink: "var(--accent-rose-soft-ink)",
  },
  "no-public-api": {
    bg: "var(--color-bg-muted)",
    ink: "var(--color-text-muted)",
  },
};

export default function ConnectionsPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Connections
        </p>
        <h1
          className="font-display mt-2 text-4xl tracking-tight sm:text-5xl"
          style={{ fontVariationSettings: '"SOFT" 90, "opsz" 144' }}
        >
          How Socialella sends posts
        </h1>
        <p className="mt-4 text-base text-[var(--color-text-muted)]">
          Today, every platform uses{" "}
          <strong className="text-[var(--color-text)]">hand-off mode</strong> —
          when a post is ready, you tap a platform pill, the caption goes to
          your clipboard, and the platform&apos;s composer opens for you to
          review and post.
        </p>
        <p className="mt-2 text-base text-[var(--color-text-muted)]">
          Auto-posting is possible per platform but each one has its own cost
          and review process. Below is what each upgrade looks like — when
          you&apos;re ready for one, ask me to wire it up.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">
          What works today
        </h2>
        <Card>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--accent-mint-ink)" }}
              >
                Always-on
              </span>
              <p className="font-medium">
                Caption to clipboard, composer opens
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Works for X, LinkedIn, Threads, Bluesky, Pinterest, Facebook,
                and more.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--accent-rose-soft-ink)" }}
              >
                Media platforms
              </span>
              <p className="font-medium">Caption + media auto-download</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                For Instagram and TikTok, your media files download
                automatically; you upload them in the app.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--accent-peach-ink)" }}
              >
                Per-platform tone
              </span>
              <p className="font-medium">Variants are sent, not base content</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                If you tuned a platform variant in Compose, the hand-off uses
                that text, not the base draft.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl tracking-tight">
          Auto-post upgrades, by platform
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Sorted by ease of upgrade. Free + credential platforms can ship in
          hours; review-gated platforms take weeks; paid API platforms have
          ongoing costs.
        </p>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CONNECTION_INFO.slice()
            .sort((a, b) => {
              const order = {
                "free-credentials": 0,
                "free-review": 1,
                "paid-api": 2,
                "no-public-api": 3,
              } as const;
              return order[a.upgradeTier] - order[b.upgradeTier];
            })
            .map((info) => {
              const tint = TIER_TINT[info.upgradeTier];
              return (
                <Card key={info.platform} className="overflow-hidden p-0">
                  <div
                    aria-hidden
                    className="h-1.5 w-full"
                    style={{ background: ACCENT_BG[info.accent] }}
                  />
                  <CardHeader className="px-5 pt-5 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl">{info.label}</h3>
                        <span
                          className="mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{
                            background: ACCENT_BG[info.accent],
                            color: ACCENT_INK[info.accent],
                          }}
                        >
                          Hand-off · active
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                        style={{ background: tint.bg, color: tint.ink }}
                      >
                        {TIER_LABEL[info.upgradeTier]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 px-5 pb-5 text-sm">
                    <dl className="space-y-1.5">
                      <div className="flex flex-col">
                        <dt className="text-xs text-[var(--color-text-muted)]">
                          Cost to upgrade
                        </dt>
                        <dd className="font-medium">{info.upgradeCost}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-xs text-[var(--color-text-muted)]">
                          Time to ship
                        </dt>
                        <dd className="font-medium">{info.upgradeTime}</dd>
                      </div>
                    </dl>
                    <p className="text-[13px] leading-relaxed text-[var(--color-text-muted)]">
                      {info.upgradeNotes}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">
          Ready to upgrade one?
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Start with the cheapest, fastest one</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Bluesky is the lowest-friction next step — open settings,
                generate an app password, and your AI agent can wire real
                auto-posting in a session.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/queue">Back to queue</Link>
              </Button>
              <Button asChild>
                <Link href="/compose">Compose a post</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
