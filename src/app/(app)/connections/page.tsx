import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CONNECTION_INFO,
  TIER_LABEL,
  type ConnectionTier,
} from "@/lib/connection-status";

export const dynamic = "force-static";

const TIER_CLASS: Record<ConnectionTier, string> = {
  "free-credentials":
    "bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success-soft)]",
  "free-review":
    "bg-[var(--color-accent-soft)] text-[var(--color-accent-soft-text)] border-[var(--color-accent-soft)]",
  "paid-api":
    "bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning-soft)]",
  "no-public-api":
    "bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)]",
};

const TIER_ORDER: Record<ConnectionTier, number> = {
  "free-credentials": 0,
  "free-review": 1,
  "paid-api": 2,
  "no-public-api": 3,
};

export default function ConnectionsPage() {
  const sorted = CONNECTION_INFO.slice().sort(
    (a, b) => TIER_ORDER[a.upgradeTier] - TIER_ORDER[b.upgradeTier],
  );

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          How Socialella sends posts and what each platform&apos;s auto-post
          upgrade costs.
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Hand-off · always on
            </p>
            <p className="mt-1.5 text-sm font-medium">
              Caption to clipboard, composer opens
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Works for X, LinkedIn, Threads, Bluesky, Pinterest, Facebook, and
              more.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Media platforms
            </p>
            <p className="mt-1.5 text-sm font-medium">
              Caption + media auto-download
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              For Instagram and TikTok, your media files download automatically;
              you upload them in the app.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Per-platform tone
            </p>
            <p className="mt-1.5 text-sm font-medium">
              Variants are sent, not base content
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              If you tuned a variant in Compose, hand-off uses that text.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Auto-post upgrades, by platform
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Sorted by ease — credential-based first, then review-gated, then
            paid APIs.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((info) => (
            <Card key={info.platform}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold">{info.label}</h3>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 border text-[10px] ${TIER_CLASS[info.upgradeTier]}`}
                  >
                    {TIER_LABEL[info.upgradeTier]}
                  </Badge>
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-success)]">
                  Hand-off · active
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
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
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Ready to upgrade one?</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Bluesky is the lowest-friction next step — generate an app
              password and your AI agent can wire real auto-posting in a
              session.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/queue">Back to queue</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/compose">Compose a post</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
