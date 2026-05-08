"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { apps, campaigns } from "@/db/schema";

const iconSchema = z.enum([
  "RocketLaunch",
  "Heart",
  "Star",
  "Code",
  "DeviceMobile",
  "PaintBrush",
  "Sparkle",
  "Leaf",
]);

const appSchema = z.object({
  name: z.string().min(1).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  icon: iconSchema,
  url: z.string().url().optional().or(z.literal("")),
});

export async function createApp(formData: FormData) {
  const parsed = appSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") ?? "#0891b2",
    icon: formData.get("icon") ?? "RocketLaunch",
    url: formData.get("url") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const db = getDb();
  await db.insert(apps).values({
    name: parsed.data.name,
    color: parsed.data.color,
    icon: parsed.data.icon,
    url: parsed.data.url || null,
  });
  revalidatePath("/apps");
  revalidatePath("/");
  revalidatePath("/compose");
  return { ok: true as const };
}

export async function updateApp(appId: string, formData: FormData) {
  const parsed = appSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    url: formData.get("url") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const db = getDb();
  await db
    .update(apps)
    .set({
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
      url: parsed.data.url || null,
    })
    .where(eq(apps.id, appId));
  revalidatePath("/apps");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteApp(appId: string) {
  const db = getDb();
  await db.delete(apps).where(eq(apps.id, appId));
  revalidatePath("/apps");
  revalidatePath("/");
  return { ok: true as const };
}

const campaignSchema = z.object({
  name: z.string().min(1).max(160),
  goal: z.string().max(2000).optional().or(z.literal("")),
  plannedPostCount: z.coerce.number().int().min(0).max(10000).optional(),
});

export async function createCampaign(appId: string, formData: FormData) {
  const parsed = campaignSchema.safeParse({
    name: formData.get("name"),
    goal: formData.get("goal") ?? "",
    plannedPostCount: formData.get("plannedPostCount") ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const db = getDb();
  await db.insert(campaigns).values({
    appId,
    name: parsed.data.name,
    goal: parsed.data.goal || null,
    plannedPostCount: parsed.data.plannedPostCount ?? 0,
  });
  revalidatePath("/apps");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteCampaign(campaignId: string) {
  const db = getDb();
  await db.delete(campaigns).where(eq(campaigns.id, campaignId));
  revalidatePath("/apps");
  return { ok: true as const };
}
