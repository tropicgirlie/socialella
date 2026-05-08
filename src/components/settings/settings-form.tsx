"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { energySlots, userSettings } from "@/db/schema";
import { WEEKDAYS, type Weekday } from "@/lib/constants";
import { replaceEnergySlots, updateUserSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type SlotRow = typeof energySlots.$inferSelect;
type SettingsRow = typeof userSettings.$inferSelect;

function parseTimeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function minutesToTime(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function SettingsForm(props: {
  settings: SettingsRow | null;
  slots: SlotRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [digestEnabled, setDigestEnabled] = useState(
    props.settings?.digestEnabled ?? false,
  );
  const [digestEmail, setDigestEmail] = useState(
    props.settings?.digestEmail ?? "",
  );
  const [cooldown, setCooldown] = useState(
    props.settings?.evergreenCooldownDays ?? 14,
  );
  const [batch, setBatch] = useState(props.settings?.evergreenBatchSize ?? 2);
  const [energyMode, setEnergyMode] = useState(
    props.settings?.energySchedulingEnabled ?? false,
  );

  const initialSlots = useMemo(() => {
    if (props.slots.length)
      return props.slots.map((s) => ({
        weekday: s.weekday as Weekday,
        start: minutesToTime(s.startMinutes),
        end: minutesToTime(s.endMinutes),
        energy: s.energy as "high" | "low",
      }));
    return WEEKDAYS.slice(1, 6).map((day) => ({
      weekday: day,
      start: "09:00",
      end: "12:00",
      energy: "high" as const,
    }));
  }, [props.slots]);

  const [slots, setSlots] = useState(initialSlots);

  function persistSettings() {
    startTransition(async () => {
      await updateUserSettings({
        digestEnabled,
        digestEmail: digestEmail || null,
        evergreenCooldownDays: cooldown,
        evergreenBatchSize: batch,
        energySchedulingEnabled: energyMode,
      });
      const payload = slots.map((s) => ({
        weekday: s.weekday,
        startMinutes: parseTimeToMinutes(s.start),
        endMinutes: parseTimeToMinutes(s.end),
        energy: s.energy,
      }));
      const res = await replaceEnergySlots(payload);
      if ("error" in res && res.error) {
        toast.error("Could not save energy windows.");
        return;
      }
      toast.success("Settings saved.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily digest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Email when posts are ready</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Requires <code className="text-xs">RESEND_API_KEY</code> on the
                server.
              </p>
            </div>
            <Switch
              checked={digestEnabled}
              onCheckedChange={(v) => setDigestEnabled(Boolean(v))}
              aria-label="Enable digest emails"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="digestEmail">Digest email</Label>
            <Input
              id="digestEmail"
              type="email"
              value={digestEmail}
              onChange={(e) => setDigestEmail(e.target.value)}
              placeholder="you@domain.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evergreen resurfacing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cooldown">Cooldown (days)</Label>
            <Input
              id="cooldown"
              type="number"
              min={1}
              value={cooldown}
              onChange={(e) => setCooldown(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="batch">Batch size per cron</Label>
            <Input
              id="batch"
              type="number"
              min={1}
              max={10}
              value={batch}
              onChange={(e) => setBatch(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Energy-aware scheduling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Show energy hints on the queue</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Suggestions only — you stay in control.
              </p>
            </div>
            <Switch
              checked={energyMode}
              onCheckedChange={(v) => setEnergyMode(Boolean(v))}
              aria-label="Energy-aware scheduling"
            />
          </div>

          <div className="space-y-3">
            {slots.map((slot, idx) => (
              <div
                key={`${slot.weekday}-${idx}`}
                className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 sm:grid-cols-4"
              >
                <select
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 text-sm"
                  value={slot.weekday}
                  onChange={(e) =>
                    setSlots((prev) =>
                      prev.map((s, i) =>
                        i === idx
                          ? { ...s, weekday: e.target.value as Weekday }
                          : s,
                      ),
                    )
                  }
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <Input
                  type="time"
                  value={slot.start}
                  onChange={(e) =>
                    setSlots((prev) =>
                      prev.map((s, i) =>
                        i === idx ? { ...s, start: e.target.value } : s,
                      ),
                    )
                  }
                />
                <Input
                  type="time"
                  value={slot.end}
                  onChange={(e) =>
                    setSlots((prev) =>
                      prev.map((s, i) =>
                        i === idx ? { ...s, end: e.target.value } : s,
                      ),
                    )
                  }
                />
                <select
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 text-sm"
                  value={slot.energy}
                  onChange={(e) =>
                    setSlots((prev) =>
                      prev.map((s, i) =>
                        i === idx
                          ? {
                              ...s,
                              energy: e.target.value as "high" | "low",
                            }
                          : s,
                      ),
                    )
                  }
                >
                  <option value="high">High energy</option>
                  <option value="low">Low energy</option>
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button type="button" onClick={persistSettings} disabled={pending}>
        Save settings
      </Button>
    </div>
  );
}
