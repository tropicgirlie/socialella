import { Suspense } from "react";
import { ComposeStudio } from "@/components/compose/compose-studio";
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
    <Suspense
      fallback={
        <p className="text-sm text-[var(--gray-500)]">
          Loading Compose Studio…
        </p>
      }
    >
      <ComposeStudio
        apps={apps}
        campaignsByApp={campaignsByApp}
        initial={initial}
      />
    </Suspense>
  );
}
