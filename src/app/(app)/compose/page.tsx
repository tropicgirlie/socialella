import { Suspense } from "react";
import { ComposeForm } from "@/components/compose/compose-form";
import { getPostFull, listApps, listCampaignsForApp } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const apps = await listApps();
  const campaignsByApp: Record<string, Awaited<ReturnType<typeof listCampaignsForApp>>> =
    {};
  for (const a of apps) {
    campaignsByApp[a.id] = await listCampaignsForApp(a.id);
  }
  const initial = sp.id ? await getPostFull(sp.id) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Compose</h1>
        <p className="text-[var(--color-text-muted)]">
          Draft once, tune per platform, keep your voice intact.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading composer…</p>}>
        <ComposeForm
          apps={apps}
          campaignsByApp={campaignsByApp}
          initial={initial}
        />
      </Suspense>
    </div>
  );
}
