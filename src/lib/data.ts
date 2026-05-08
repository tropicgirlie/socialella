import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  max,
} from "drizzle-orm";
import { getDb } from "@/db";
import {
  apps,
  campaigns,
  energySlots,
  postMedia,
  posts,
  postVariants,
  safetyClips,
  userSettings,
} from "@/db/schema";

export async function listApps() {
  const db = getDb();
  return db.select().from(apps).orderBy(asc(apps.name));
}

export async function listCampaignsForApp(appId: string) {
  const db = getDb();
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.appId, appId))
    .orderBy(asc(campaigns.name));
}

export async function getPostFull(id: string) {
  const db = getDb();
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return null;
  const variants = await db
    .select()
    .from(postVariants)
    .where(eq(postVariants.postId, id));
  const media = await db
    .select()
    .from(postMedia)
    .where(eq(postMedia.postId, id));
  return { post, variants, media };
}

export async function listPostsByStatuses(
  statuses: string[],
  opts: { appId?: string } = {},
) {
  const db = getDb();
  const where = opts.appId
    ? and(inArray(posts.status, statuses), eq(posts.appId, opts.appId))
    : inArray(posts.status, statuses);
  return db
    .select()
    .from(posts)
    .where(where)
    .orderBy(desc(posts.scheduledFor), desc(posts.updatedAt));
}

export async function listPostsForRange(start: Date, end: Date) {
  const db = getDb();
  return db
    .select()
    .from(posts)
    .where(
      and(
        inArray(posts.status, ["scheduled", "ready_to_post"]),
        gte(posts.scheduledFor, start),
        lte(posts.scheduledFor, end),
      ),
    )
    .orderBy(asc(posts.scheduledFor));
}

export async function listEvergreenPool() {
  const db = getDb();
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.isEvergreen, true), eq(posts.status, "posted")))
    .orderBy(desc(posts.postedAt));
}

export async function listDraftsAndArchived() {
  const db = getDb();
  return db
    .select()
    .from(posts)
    .where(inArray(posts.status, ["draft", "archived"]))
    .orderBy(desc(posts.updatedAt));
}

export async function getAppCoverage() {
  const db = getDb();
  const appRows = await db.select().from(apps);
  const lastPosted = await db
    .select({
      appId: posts.appId,
      last: max(posts.postedAt),
    })
    .from(posts)
    .where(eq(posts.status, "posted"))
    .groupBy(posts.appId);

  const map = new Map(lastPosted.map((r) => [r.appId, r.last]));

  const now = new Date();
  return appRows.map((a) => {
    const last = map.get(a.id);
    const daysSince = last
      ? Math.floor((now.getTime() - new Date(last).getTime()) / 86400000)
      : null;
    return {
      ...a,
      lastPostedAt: last,
      daysSinceLastPost: daysSince,
    };
  });
}

export async function getCampaignProgress() {
  const db = getDb();
  const camps = await db.select().from(campaigns);
  const out = [];
  for (const c of camps) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(eq(posts.campaignId, c.id), eq(posts.status, "posted")));
    out.push({
      campaign: c,
      postedCount: Number(count),
      planned: c.plannedPostCount ?? 0,
    });
  }
  return out;
}

export async function getTodaysScheduled(now = new Date()) {
  const db = getDb();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return db
    .select()
    .from(posts)
    .where(
      and(
        inArray(posts.status, ["scheduled", "ready_to_post"]),
        gte(posts.scheduledFor, start),
        lte(posts.scheduledFor, end),
      ),
    )
    .orderBy(asc(posts.scheduledFor));
}

export async function getReadyToPost() {
  const db = getDb();
  return db
    .select()
    .from(posts)
    .where(eq(posts.status, "ready_to_post"))
    .orderBy(desc(posts.scheduledFor));
}

export async function listEnergySlots() {
  const db = getDb();
  return db.select().from(energySlots).orderBy(asc(energySlots.weekday));
}

export async function getUserSettingsRow() {
  const db = getDb();
  const [row] = await db.select().from(userSettings).limit(1);
  return row ?? null;
}

export async function listSafetyClips() {
  const db = getDb();
  return db.select().from(safetyClips).orderBy(desc(safetyClips.capturedAt));
}
