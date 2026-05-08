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

export default async function DashboardPage() {
  const today = await getTodaysScheduled();
  const ready = await getReadyToPost();
  const coverage = await getAppCoverage();
  const campaigns = await getCampaignProgress();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-[var(--color-text-muted)]">
            Coverage, cadence, and what needs your attention today.
          </p>
        </div>
        <Button asChild>
          <Link href="/compose">New post</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ready to post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ready.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nothing waiting — schedule something lovely.
              </p>
            ) : (
              ready.map((p) => (
                <div
                  key={p.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm"
                >
                  <p className="line-clamp-2">{p.baseContent}</p>
                  <Button className="mt-2" variant="outline" size="sm" asChild>
                    <Link href="/queue">Open queue</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {today.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No slots today yet.
              </p>
            ) : (
              today.map((p) => (
                <div key={p.id} className="text-sm">
                  <p className="font-medium">
                    {p.scheduledFor
                      ? new Date(p.scheduledFor).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                  <p className="line-clamp-2 text-[var(--color-text-muted)]">
                    {p.baseContent}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage by app</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {coverage.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Add an app to track cadence.
            </p>
          ) : (
            coverage.map((a) => (
              <div
                key={a.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{a.name}</p>
                  {typeof a.daysSinceLastPost === "number" && (
                    <Badge variant="secondary">
                      {a.daysSinceLastPost}d since post
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Last posted:{" "}
                  {a.lastPostedAt
                    ? new Date(a.lastPostedAt).toLocaleDateString()
                    : "never"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaigns.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              Create campaigns under Apps.
            </p>
          ) : (
            campaigns.map((c) => (
              <div key={c.campaign.id} className="text-sm">
                <p className="font-medium">{c.campaign.name}</p>
                <p className="text-[var(--color-text-muted)]">
                  {c.postedCount} posted
                  {c.planned ? ` · ${c.planned} planned` : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
