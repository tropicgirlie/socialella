import Link from "next/link";
import { QueueView } from "@/components/queue/queue-view";
import { listApps, listPostsByStatuses } from "@/lib/data";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const params = await searchParams;
  const appFilter = params.app?.trim() || undefined;

  const [scheduled, ready, posted, apps] = await Promise.all([
    listPostsByStatuses(["scheduled"], { appId: appFilter }),
    listPostsByStatuses(["ready_to_post"], { appId: appFilter }),
    listPostsByStatuses(["posted"], { appId: appFilter }),
    listApps(),
  ]);

  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));
  const filteredApp = appFilter
    ? apps.find((a) => a.id === appFilter)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {filteredApp ? `${filteredApp.name} · Queue` : "Queue"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {filteredApp
              ? `Posts for ${filteredApp.name}. `
              : "All posts across every app. "}
            One tap per platform — caption to clipboard, composer opens, you
            review and post.{" "}
            <Link
              href="/connections"
              className="text-[var(--color-accent)] hover:underline"
            >
              How sending works
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          {filteredApp && (
            <Button asChild variant="outline" size="sm">
              <Link href="/queue">Show all apps</Link>
            </Button>
          )}
          <Button asChild size="sm">
            <Link
              href={
                filteredApp
                  ? `/compose?appId=${filteredApp.id}`
                  : "/compose"
              }
            >
              New post
            </Link>
          </Button>
        </div>
      </div>
      <QueueView
        scheduled={scheduled}
        ready={ready}
        posted={posted.slice(0, 40)}
        appNames={appNames}
      />
    </div>
  );
}
