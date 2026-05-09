"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  PLATFORMS,
  type EnergyTag,
  type PlatformId,
} from "@/lib/constants";
import { applyTonePreset, defaultToneForPlatform } from "@/lib/tone";
import { defaultChecklist } from "@/lib/founder-checklist";
import { suggestNextSlot, describeSlotReason } from "@/lib/scheduling";
import { posts, postVariants } from "@/db/schema";

const platformSchema = z
  .string()
  .refine((s): s is PlatformId =>
    (PLATFORMS as readonly string[]).includes(s),
  );

const upsertSchema = z.object({
  appId: z.string().uuid(),
  campaignId: z.string().uuid().nullable().optional(),
  baseContent: z.string().max(20000),
  launchDayMode: z.boolean(),
  isEvergreen: z.boolean(),
  energyTag: z.enum(["high", "low"]).nullable().optional(),
  founderChecklistJson: z.record(z.string(), z.boolean()).optional(),
  variants: z.array(
    z.object({
      platform: platformSchema,
      content: z.string().max(20000),
      tone: z.enum(["raw", "pro", "punchy", "warm"]),
    }),
  ),
});

export async function savePost(
  postId: string | null,
  payload: z.infer<typeof upsertSchema>,
) {
  const parsed = upsertSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const db = getDb();
  const now = new Date();
  const checklist =
    parsed.data.founderChecklistJson ??
    defaultChecklist(parsed.data.launchDayMode);

  let id = postId;
  if (!id) {
    const inserted = await db
      .insert(posts)
      .values({
        appId: parsed.data.appId,
        campaignId: parsed.data.campaignId ?? null,
        status: "draft",
        baseContent: parsed.data.baseContent,
        founderChecklistJson: checklist,
        isEvergreen: parsed.data.isEvergreen,
        energyTag: parsed.data.energyTag ?? null,
        launchDayMode: parsed.data.launchDayMode,
        updatedAt: now,
      })
      .returning({ id: posts.id });
    id = inserted[0]!.id;
  } else {
    await db
      .update(posts)
      .set({
        appId: parsed.data.appId,
        campaignId: parsed.data.campaignId ?? null,
        baseContent: parsed.data.baseContent,
        founderChecklistJson: checklist,
        isEvergreen: parsed.data.isEvergreen,
        energyTag: parsed.data.energyTag ?? null,
        launchDayMode: parsed.data.launchDayMode,
        updatedAt: now,
      })
      .where(eq(posts.id, id));
    await db.delete(postVariants).where(eq(postVariants.postId, id));
  }

  for (const v of parsed.data.variants) {
    await db.insert(postVariants).values({
      postId: id,
      platform: v.platform,
      content: v.content,
      tone: v.tone,
    });
  }

  revalidatePath("/compose");
  revalidatePath("/library");
  revalidatePath("/queue");
  revalidatePath("/");
  return { ok: true as const, id };
}

export async function schedulePost(postId: string, isoDateTime: string) {
  const db = getDb();
  const when = new Date(isoDateTime);
  if (Number.isNaN(when.getTime())) {
    return { error: "Invalid date" };
  }
  await db
    .update(posts)
    .set({
      status: "scheduled",
      scheduledFor: when,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));
  revalidatePath("/queue");
  revalidatePath("/");
  revalidatePath("/compose");
  return { ok: true as const };
}

export async function reschedulePost(postId: string, isoDateTime: string) {
  return schedulePost(postId, isoDateTime);
}

/**
 * Suggest a schedule slot for a given energy tag.
 * Used by the Compose Studio bottom Schedule card.
 */
export async function suggestSlotForEnergy(
  energyTag: EnergyTag | null,
): Promise<{
  iso: string;
  hint: string;
}> {
  const result = await suggestNextSlot(energyTag);
  return {
    iso: result.iso,
    hint: describeSlotReason(result.reason),
  };
}

export async function markPosted(postId: string) {
  const db = getDb();
  await db
    .update(posts)
    .set({
      status: "posted",
      postedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId));
  revalidatePath("/queue");
  revalidatePath("/library");
  revalidatePath("/");
  return { ok: true as const };
}

export async function archivePost(postId: string) {
  const db = getDb();
  await db
    .update(posts)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(posts.id, postId));
  revalidatePath("/library");
  return { ok: true as const };
}

export async function deletePost(postId: string) {
  const db = getDb();
  await db.delete(posts).where(eq(posts.id, postId));
  revalidatePath("/library");
  revalidatePath("/queue");
  revalidatePath("/");
  return { ok: true as const };
}

export async function regenerateTones(postId: string, base: string) {
  const db = getDb();
  const variants = await db
    .select()
    .from(postVariants)
    .where(eq(postVariants.postId, postId));
  for (const v of variants) {
    const tone = defaultToneForPlatform(v.platform as PlatformId);
    const content = applyTonePreset(base, v.platform as PlatformId, tone);
    await db
      .update(postVariants)
      .set({ content, tone })
      .where(eq(postVariants.id, v.id));
  }
  revalidatePath("/compose");
  return { ok: true as const };
}

/** Quick-add variants from base copy when missing. */
export async function ensureVariantsFromBase(postId: string, base: string) {
  const db = getDb();
  await db.delete(postVariants).where(eq(postVariants.postId, postId));
  const inserts = PLATFORMS.map((p) => {
    const tone = defaultToneForPlatform(p);
    return {
      postId,
      platform: p,
      content: applyTonePreset(base, p, tone),
      tone,
    };
  });
  await db.insert(postVariants).values(inserts);
  revalidatePath("/compose");
  return { ok: true as const };
}
