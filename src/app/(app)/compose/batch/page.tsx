import { BatchCompose } from "@/components/batch/batch-compose";
import { listApps } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BatchComposePage() {
  const apps = await listApps();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight">
          Batch compose
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Distraction-light drafting — save everything as drafts when you are
          done.
        </p>
      </div>
      {apps.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          Add an app first on the Apps page.
        </p>
      ) : (
        <BatchCompose apps={apps} />
      )}
    </div>
  );
}
