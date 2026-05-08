import { QueueView } from "@/components/queue/queue-view";
import { listApps, listPostsByStatuses } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const scheduled = await listPostsByStatuses(["scheduled"]);
  const ready = await listPostsByStatuses(["ready_to_post"]);
  const posted = await listPostsByStatuses(["posted"]);
  const apps = await listApps();
  const appNames = Object.fromEntries(apps.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Queue</h1>
        <p className="text-[var(--color-text-muted)]">
          Scaffold publishing — copy to platforms, then mark posted here.
        </p>
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
