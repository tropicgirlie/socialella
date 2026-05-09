import Link from "next/link";
import { QueueView } from "@/components/queue/queue-view";
import { listApps, listPostsByStatuses } from "@/lib/data";
import { getBlueskyConnection } from "@/actions/connections";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    app?: string;
    highlight?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const params = await searchParams;
  const appFilter = params.app?.trim() || undefined;
  const highlightId = params.highlight?.trim() || null;
  const statusParam = params.status?.trim();
  const defaultTab =
    statusParam === "ready"
      ? "ready"
      : statusParam === "posted"
        ? "posted"
        : statusParam === "scheduled"
          ? "scheduled"
          : undefined;

  const [scheduled, ready, posted, apps, bluesky] = await Promise.all([
    listPostsByStatuses(["scheduled"], { appId: appFilter }),
    listPostsByStatuses(["ready_to_post"], { appId: appFilter }),
    listPostsByStatuses(["posted"], { appId: appFilter }),
    listApps(),
    getBlueskyConnection(),
  ]);

  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));
  const appColors = Object.fromEntries(apps.map((a) => [a.id, a.color]));
  const filteredApp = appFilter
    ? apps.find((a) => a.id === appFilter)
    : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--gray-900)]">
            {filteredApp ? `${filteredApp.name} · Queue` : "Queue"}
          </h1>
          <p className="mt-1 text-sm text-[var(--gray-600)]">
            {filteredApp
              ? `Posts for ${filteredApp.name}. `
              : "Everything in flight across your apps. "}
            Caption to clipboard, composer opens, you review and post.{" "}
            <Link
              href="/connections"
              className="text-[var(--violet-600)] hover:underline"
            >
              How sending works
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredApp && (
            <Link
              href="/queue"
              className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
            >
              Show all apps
            </Link>
          )}
          <Link
            href={
              filteredApp
                ? `/compose?appId=${filteredApp.id}`
                : "/compose"
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-semibold text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
          >
            <Icon name="PencilSimple" className="h-3.5 w-3.5" />
            New post
          </Link>
        </div>
      </header>

      <QueueView
        scheduled={scheduled}
        ready={ready}
        posted={posted.slice(0, 40)}
        appNames={appNames}
        appColors={appColors}
        highlightId={highlightId}
        defaultTab={defaultTab}
        blueskyConnected={Boolean(bluesky)}
      />
    </div>
  );
}
