import Link from "next/link";
import { format } from "date-fns";
import {
  getAppCoverage,
  getCampaignProgress,
  getDashboardKpis,
  getShippedByApp,
} from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChannelBars } from "@/components/dashboard/channel-bars";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Reports · Socialella",
};

export default async function ReportsPage() {
  const [kpis, byApp, coverage, campaigns] = await Promise.all([
    getDashboardKpis(30),
    getShippedByApp(30),
    getAppCoverage(),
    getCampaignProgress(),
  ]);

  const stalest = coverage
    .filter((a) => typeof a.daysSinceLastPost === "number")
    .sort((a, b) => (b.daysSinceLastPost ?? 0) - (a.daysSinceLastPost ?? 0))[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Monthly snapshot · {format(new Date(), "MMMM yyyy")}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Reports
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">
            A printable view of what shipped, what&apos;s active, and what
            needs attention. Engagement metrics arrive when an app has an API
            connection.
          </p>
        </div>
        <Button size="sm" variant="outline" disabled>
          <Icon name="FileText" className="h-3.5 w-3.5" />
          Export PDF — soon
        </Button>
      </header>

      <Card>
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Activity at a glance
          </h2>
        </div>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Shipped · 30d
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {kpis.shippedThisRange}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Prior 30d
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {kpis.shippedPriorRange}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Apps tracked
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {kpis.activeApps}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Quietest app
            </p>
            <p className="mt-1 truncate text-sm font-medium">
              {stalest && typeof stalest.daysSinceLastPost === "number"
                ? `${stalest.name} · ${stalest.daysSinceLastPost}d`
                : "All caught up"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Shipped by app
          </h2>
        </div>
        <CardContent className="p-5">
          {byApp.length === 0 || byApp.every((a) => a.shipped === 0) ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
              No posts shipped this month.
            </p>
          ) : (
            <ChannelBars
              data={byApp.map((a) => ({
                id: a.id,
                name: a.name,
                color: a.color,
                value: a.shipped,
              }))}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Campaigns
          </h2>
        </div>
        <CardContent className="p-5">
          {campaigns.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
              No campaigns this month.
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  <th className="py-2 pr-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Campaign
                  </th>
                  <th className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Posted
                  </th>
                  <th className="px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Planned
                  </th>
                  <th className="px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const progress = c.planned
                    ? Math.min(
                        100,
                        Math.round((c.postedCount / c.planned) * 100),
                      )
                    : null;
                  return (
                    <tr
                      key={c.campaign.id}
                      className="border-b border-[var(--color-border)] last:border-b-0"
                    >
                      <td className="py-2.5 pr-2 font-medium text-[var(--color-text)]">
                        {c.campaign.name}
                      </td>
                      <td className="px-2 py-2.5 tabular-nums text-[var(--color-text-muted)]">
                        {c.postedCount}
                      </td>
                      <td className="px-2 py-2.5 tabular-nums text-[var(--color-text-muted)]">
                        {c.planned || "—"}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {progress != null ? (
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                              progress >= 75
                                ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                                : progress >= 40
                                  ? "bg-[var(--color-accent-soft)] text-[var(--color-accent-soft-text)]"
                                  : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
                            )}
                          >
                            {progress}%
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-text-subtle)]">
                            No goal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 text-sm text-[var(--color-text-muted)]">
          <p>
            Engagement and reach summaries appear here once a connected
            platform reports them. See{" "}
            <Link
              href="/connections"
              className="font-medium text-[var(--color-accent)] hover:underline"
            >
              Connections
            </Link>{" "}
            to enable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
