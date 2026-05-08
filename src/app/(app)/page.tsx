import Link from "next/link";
import {
  getAppCoverage,
  getCampaignProgress,
  getReadyToPost,
  getTodaysScheduled,
} from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const [today, ready, coverage, campaigns] = await Promise.all([
    getTodaysScheduled(),
    getReadyToPost(),
    getAppCoverage(),
    getCampaignProgress(),
  ]);

  const stalest = coverage
    .filter((a) => typeof a.daysSinceLastPost === "number")
    .sort(
      (a, b) =>
        (b.daysSinceLastPost ?? 0) - (a.daysSinceLastPost ?? 0),
    )[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            What needs your attention today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/queue">Open queue</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/compose">New post</Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Today" value={today.length} hint="Scheduled today" />
        <StatTile
          label="Ready"
          value={ready.length}
          hint="Waiting to post"
        />
        <StatTile
          label="Apps"
          value={coverage.length}
          hint={
            stalest
              ? `${stalest.name}: ${stalest.daysSinceLastPost}d`
              : "All caught up"
          }
        />
        <StatTile
          label="Campaigns"
          value={campaigns.length}
          hint={
            campaigns.length > 0
              ? `${campaigns.reduce(
                  (s, c) => s + c.postedCount,
                  0,
                )} posts shipped`
              : "None active"
          }
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Today&apos;s queue</CardTitle>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/queue">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                No posts scheduled for today.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {today.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-baseline gap-3 py-2.5 text-sm"
                  >
                    <span className="w-14 shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                      {p.scheduledFor
                        ? new Date(p.scheduledFor).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                    <p className="line-clamp-2">{p.baseContent || "(empty)"}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Ready to post</CardTitle>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/queue">Open inbox</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ready.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                Nothing waiting. Schedule something when you&apos;re ready.
              </p>
            ) : (
              <ul className="space-y-2">
                {ready.slice(0, 4).map((p) => (
                  <li
                    key={p.id}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-muted)]/60 p-3 text-sm"
                  >
                    <p className="line-clamp-2">{p.baseContent || "(empty)"}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coverage by app</CardTitle>
          </CardHeader>
          <CardContent>
            {coverage.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                Add an app under <Link href="/apps" className="text-[var(--color-accent)] hover:underline">Apps</Link> to track cadence.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {coverage.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <Link
                      href={`/queue?app=${a.id}`}
                      className="flex min-w-0 items-center gap-2 truncate hover:underline"
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
                        style={{ backgroundColor: a.color }}
                      />
                      <span className="truncate font-medium">{a.name}</span>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      {typeof a.daysSinceLastPost === "number" ? (
                        <Badge variant="secondary">
                          {a.daysSinceLastPost}d ago
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Never</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign progress</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                Create a campaign in <Link href="/apps" className="text-[var(--color-accent)] hover:underline">Apps</Link> to bundle posts around a launch.
              </p>
            ) : (
              <ul className="space-y-3">
                {campaigns.map((c) => {
                  const progress = c.planned
                    ? Math.min(100, Math.round((c.postedCount / c.planned) * 100))
                    : 0;
                  return (
                    <li key={c.campaign.id} className="text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-medium">{c.campaign.name}</p>
                        <p className="shrink-0 text-xs text-[var(--color-text-muted)]">
                          {c.postedCount}
                          {c.planned ? `/${c.planned}` : ""}
                        </p>
                      </div>
                      {c.planned ? (
                        <div
                          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]"
                          role="progressbar"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)]"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          No goal set
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
