import Link from "next/link";
import {
  getAppCoverage,
  getCampaignProgress,
  getReadyToPost,
  getTodaysScheduled,
} from "@/lib/data";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Late-night focus";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Burning the candle";
}

type AccentName = "rose" | "lemon" | "mint" | "peach";

const ACCENT: Record<AccentName, { stripe: string; chip: string; ink: string }> =
  {
    rose: {
      stripe: "var(--accent-rose-soft)",
      chip: "var(--accent-rose-soft)",
      ink: "var(--accent-rose-soft-ink)",
    },
    lemon: {
      stripe: "var(--accent-lemon)",
      chip: "var(--accent-lemon)",
      ink: "var(--accent-lemon-ink)",
    },
    mint: {
      stripe: "var(--accent-mint)",
      chip: "var(--accent-mint)",
      ink: "var(--accent-mint-ink)",
    },
    peach: {
      stripe: "var(--accent-peach)",
      chip: "var(--accent-peach)",
      ink: "var(--accent-peach-ink)",
    },
  };

function BentoCard({
  accent,
  eyebrow,
  title,
  count,
  children,
}: {
  accent: AccentName;
  eyebrow: string;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <Card className="relative overflow-hidden p-0">
      <div
        aria-hidden
        className="h-2 w-full"
        style={{ background: a.stripe }}
      />
      <CardHeader className="flex-row items-start justify-between gap-3 px-6 pt-5 pb-3">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: a.ink }}
          >
            {eyebrow}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight">{title}</h2>
        </div>
        {typeof count === "number" && (
          <span
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm font-semibold"
            style={{ background: a.chip, color: a.ink }}
          >
            {count}
          </span>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">{children}</CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const today = await getTodaysScheduled();
  const ready = await getReadyToPost();
  const coverage = await getAppCoverage();
  const campaigns = await getCampaignProgress();

  const greeting = timeOfDayGreeting();

  return (
    <div className="space-y-10">
      {/* Editorial greeting strip */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            Today
          </p>
          <h1
            className="font-display mt-2 text-4xl sm:text-5xl leading-[1.05]"
            style={{ fontVariationSettings: '"SOFT" 90, "opsz" 144' }}
          >
            {greeting},{" "}
            <span className="italic text-[var(--color-accent)]">founder.</span>
          </h1>
          <p className="mt-3 text-base text-[var(--color-text-muted)]">
            Your queue, your apps, your rhythm — quietly tended in one place.
          </p>
        </div>
        <Button asChild size="lg" className="self-start sm:self-end">
          <Link href="/compose">New post</Link>
        </Button>
      </header>

      {/* Bento — primary cards */}
      <div className="grid gap-5 md:grid-cols-2">
        <BentoCard
          accent="lemon"
          eyebrow="Today's queue"
          title="On the calendar"
          count={today.length}
        >
          {today.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No slots scheduled today. A quiet day is also a kind one.
            </p>
          ) : (
            <ul className="space-y-3">
              {today.map((p) => (
                <li
                  key={p.id}
                  className="flex items-baseline gap-3 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
                >
                  <span className="font-display text-lg leading-none w-16 shrink-0">
                    {p.scheduledFor
                      ? new Date(p.scheduledFor).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                  <p className="line-clamp-2 text-sm text-[var(--color-text)]">
                    {p.baseContent}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/queue">View calendar</Link>
            </Button>
          </div>
        </BentoCard>

        <BentoCard
          accent="rose"
          eyebrow="Ready to post"
          title="Waiting for you"
          count={ready.length}
        >
          {ready.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Inbox zero. Schedule something lovely when you're ready.
            </p>
          ) : (
            <ul className="space-y-3">
              {ready.slice(0, 4).map((p) => (
                <li
                  key={p.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/40 p-3 text-sm"
                >
                  <p className="line-clamp-2">{p.baseContent}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/queue">Open inbox</Link>
            </Button>
          </div>
        </BentoCard>

        <BentoCard
          accent="mint"
          eyebrow="App coverage"
          title="What needs attention"
          count={coverage.length}
        >
          {coverage.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Add an app under <strong>Apps</strong> to track cadence.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {coverage.slice(0, 6).map((a) => (
                <li
                  key={a.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium">{a.name}</p>
                    {typeof a.daysSinceLastPost === "number" && (
                      <Badge variant="secondary" className="shrink-0">
                        {a.daysSinceLastPost}d
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {a.lastPostedAt
                      ? `Last: ${new Date(a.lastPostedAt).toLocaleDateString()}`
                      : "No posts yet"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard
          accent="peach"
          eyebrow="Campaigns"
          title="In flight"
          count={campaigns.length}
        >
          {campaigns.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Create a campaign in <strong>Apps</strong> to bundle posts around a
              launch or theme.
            </p>
          ) : (
            <ul className="space-y-3">
              {campaigns.map((c) => {
                const progress = c.planned
                  ? Math.min(100, Math.round((c.postedCount / c.planned) * 100))
                  : 0;
                return (
                  <li key={c.campaign.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium">{c.campaign.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {c.postedCount}
                        {c.planned ? `/${c.planned}` : ""}
                      </p>
                    </div>
                    {c.planned ? (
                      <div
                        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            background: "var(--color-accent)",
                          }}
                        />
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        No goal set — every post counts.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </BentoCard>
      </div>
    </div>
  );
}
