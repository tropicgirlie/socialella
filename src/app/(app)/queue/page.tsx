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
        <h1 className="font-display text-4xl tracking-tight">Queue</h1>
        <p className="text-[var(--color-text-muted)]">
          One tap per platform — caption to clipboard, composer opens, you
          review and post. <a className="underline underline-offset-2 hover:text-[var(--color-text)]" href="/connections">How sending works</a>.
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
