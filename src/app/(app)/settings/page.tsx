import { SettingsForm } from "@/components/settings/settings-form";
import { ensureUserSettings } from "@/lib/settings";
import { listEnergySlots } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await ensureUserSettings();
  const slots = await listEnergySlots();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-[var(--color-text-muted)]">
          Digests, evergreen cadence, and optional energy windows for gentler
          scheduling.
        </p>
      </div>
      <SettingsForm settings={settings} slots={slots} />
    </div>
  );
}
