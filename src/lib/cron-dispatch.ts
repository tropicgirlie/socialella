import { and, eq, lte, or, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { posts, postVariants, scheduleRuns, userSettings } from "@/db/schema";

export async function dispatchScheduledPosts(now = new Date()) {
  const db = getDb();
  const due = await db
    .select()
    .from(posts)
    .where(
      and(eq(posts.status, "scheduled"), lte(posts.scheduledFor, now)),
    );

  for (const post of due) {
    await db
      .update(posts)
      .set({
        status: "ready_to_post",
        updatedAt: now,
      })
      .where(eq(posts.id, post.id));

    await db.insert(scheduleRuns).values({
      postId: post.id,
      outcome: "ready_to_post",
    });
  }

  return due.length;
}

export async function resurfaceEvergreenPosts(now = new Date()) {
  const db = getDb();
  const [settings] = await db.select().from(userSettings).limit(1);
  const cooldownDays = settings?.evergreenCooldownDays ?? 14;
  const batch = settings?.evergreenBatchSize ?? 2;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - cooldownDays);

  const candidates = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.isEvergreen, true),
        eq(posts.status, "posted"),
        or(
          isNull(posts.lastResurfacedAt),
          lt(posts.lastResurfacedAt, cutoff),
        ),
      ),
    )
    .limit(batch);

  let created = 0;
  for (const src of candidates) {
    const [inserted] = await db
      .insert(posts)
      .values({
        appId: src.appId,
        campaignId: src.campaignId,
        status: "draft",
        baseContent: src.baseContent,
        founderChecklistJson: src.founderChecklistJson ?? {},
        isEvergreen: false,
        energyTag: "low",
        evergreenSourceId: src.id,
        launchDayMode: false,
        updatedAt: now,
      })
      .returning({ id: posts.id });

    if (inserted) {
      const variants = await db
        .select()
        .from(postVariants)
        .where(eq(postVariants.postId, src.id));
      for (const v of variants) {
        await db.insert(postVariants).values({
          postId: inserted.id,
          platform: v.platform,
          content: v.content,
          tone: v.tone,
        });
      }
      await db
        .update(posts)
        .set({ lastResurfacedAt: now, updatedAt: now })
        .where(eq(posts.id, src.id));
      created++;
    }
  }

  return created;
}
