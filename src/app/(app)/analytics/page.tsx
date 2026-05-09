import Link from "next/link";
import {
  getDashboardKpis,
  getPostsShippedSeries,
  getShippedByApp,
} from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ChannelBars } from "@/components/dashboard/channel-bars";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Analytics · Socialella",
};

type RangeKey = "7d" | "30d" | "90d";

function parseRange(v: string | string[] | undefined): { key: RangeKey; days: number; label: string } {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === "7d") return { key: "7d", days: 7, label: "Last 7 days" };
  if (raw === "90d") return { key: "90d", days: 90, label: "Last 90 days" };
  return { key: "30d", days: 30, label: "Last 30 days" };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await searchParams;
  const range = parseRange(sp.range);

  const [kpis, series, byApp] = await Promise.all([
    getDashboardKpis(range.days),
    getPostsShippedSeries(range.days),
    getShippedByApp(range.days),
  ]);

  const delta = kpis.shippedThisRange - kpis.shippedPriorRange;
  const trend = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const pct =
    kpis.shippedPriorRange === 0
      ? null
      : Math.round((delta / kpis.shippedPriorRange) * 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {range.label}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            What you shipped and how cadence is trending. Engagement metrics
            unlock once an app has an API connection.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/connections">Add a connection</Link>
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Posts shipped
            </p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">
              {kpis.shippedThisRange}
            </p>
            <p
              className={cn(
                "mt-2 inline-flex items-center gap-1 text-xs font-medium",
                trend === "up" && "text-[var(--color-success)]",
                trend === "down" && "text-[var(--color-danger)]",
                trend === "flat" && "text-[var(--color-text-muted)]",
              )}
            >
              {trend !== "flat" && (
                <Icon
                  name={trend === "up" ? "ArrowUp" : "ArrowDown"}
                  className="h-3 w-3"
                  weight="bold"
                />
              )}
              {pct == null
                ? "First period"
                : `${trend === "down" ? "−" : trend === "up" ? "+" : ""}${Math.abs(pct)}% vs prior`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Active apps
            </p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">
              {kpis.activeApps}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Across the workspace
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Scheduled · 7d
            </p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">
              {kpis.scheduledNext7d}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Next week ahead
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Evergreen pool
            </p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight">
              {kpis.evergreenPool}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Available to recycle
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Daily activity
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Posts shipped per day · {range.label.toLowerCase()}
          </p>
        </div>
        <CardContent className="p-5">
          <TrendChart
            data={series.map((d) => ({ date: d.date, value: d.count }))}
          />
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Shipped by app
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Where attention went this period
          </p>
        </div>
        <CardContent className="p-5">
          {byApp.length === 0 || byApp.every((a) => a.shipped === 0) ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
              No posts shipped yet in this range.
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
        <CardContent className="p-5">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Reach, engagement, and click metrics
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                These come from each platform&apos;s API. Connect at least one
                paid endpoint to unlock cross-channel performance.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/connections">Open Connections</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
