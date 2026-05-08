"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { energySlots, userSettings } from "@/db/schema";
import { ensureUserSettings } from "@/lib/settings";
import { WEEKDAYS, type Weekday } from "@/lib/constants";

const weekdaySchema = z.custom<Weekday>(
  (v) => typeof v === "string" && (WEEKDAYS as readonly string[]).includes(v),
  "Invalid weekday",
);

const slotSchema = z.object({
  weekday: weekdaySchema,
  startMinutes: z.number().int().min(0).max(24 * 60),
  endMinutes: z.number().int().min(0).max(24 * 60),
  energy: z.enum(["high", "low"]),
});

export async function replaceEnergySlots(
  slots: z.infer<typeof slotSchema>[],
) {
  const parsed = z.array(slotSchema).safeParse(slots);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const db = getDb();
  await db.delete(energySlots);
  if (parsed.data.length) {
    await db.insert(energySlots).values(parsed.data);
  }
  revalidatePath("/settings");
  revalidatePath("/queue");
  return { ok: true as const };
}

export async function updateUserSettings(payload: {
  digestEnabled?: boolean;
  digestEmail?: string | null;
  evergreenCooldownDays?: number;
  evergreenBatchSize?: number;
  energySchedulingEnabled?: boolean;
}) {
  await ensureUserSettings();
  const db = getDb();
  await db
    .update(userSettings)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.id, 1));
  revalidatePath("/settings");
  return { ok: true as const };
}
