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

/* ----------------------------------------------------------------------------
 * Dashboard analytics — derived from data we actually have (no fake metrics).
 * Socialella runs in hand-off mode, so we count what was *shipped* (status =
 * "posted" with a postedAt) and what's flowing through the queue.
 * ----------------------------------------------------------------------------*/

export type PostsShippedDay = {
  date: string; // YYYY-MM-DD
  count: number;
};

export async function getPostsShippedSeries(days = 30): Promise<PostsShippedDay[]> {
  const db = getDb();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ postedAt: posts.postedAt })
    .from(posts)
    .where(
      and(
        eq(posts.status, "posted"),
        gte(posts.postedAt, start),
        lte(posts.postedAt, end),
      ),
    );

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const r of rows) {
    if (!r.postedAt) continue;
    const key = new Date(r.postedAt).toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export type AppShipBreakdown = {
  id: string;
  name: string;
  color: string;
  shipped: number;
};

export async function getShippedByApp(days = 30): Promise<AppShipBreakdown[]> {
  const db = getDb();
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const appRows = await db.select().from(apps);
  const grouped = await db
    .select({
      appId: posts.appId,
      count: sql<number>`count(*)`,
    })
    .from(posts)
    .where(
      and(
        eq(posts.status, "posted"),
        gte(posts.postedAt, start),
        lte(posts.postedAt, end),
      ),
    )
    .groupBy(posts.appId);

  const map = new Map(grouped.map((r) => [r.appId, Number(r.count)]));
  return appRows
    .map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      shipped: map.get(a.id) ?? 0,
    }))
    .sort((a, b) => b.shipped - a.shipped);
}

export type DashboardKpis = {
  shippedThisRange: number;
  shippedPriorRange: number;
  scheduledNext7d: number;
  readyCount: number;
  evergreenPool: number;
  activeApps: number;
};

export async function getDashboardKpis(days = 30): Promise<DashboardKpis> {
  const db = getDb();
  const now = new Date();
  const endThis = new Date(now);
  const startThis = new Date(now);
  startThis.setDate(startThis.getDate() - (days - 1));
  startThis.setHours(0, 0, 0, 0);

  const endPrior = new Date(startThis);
  endPrior.setMilliseconds(endPrior.getMilliseconds() - 1);
  const startPrior = new Date(endPrior);
  startPrior.setDate(startPrior.getDate() - (days - 1));
  startPrior.setHours(0, 0, 0, 0);

  const next7End = new Date(now);
  next7End.setDate(next7End.getDate() + 7);

  const [shippedThisRow, shippedPriorRow, scheduledRow, readyRow, evergreenRow, appsRow] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(
          and(
            eq(posts.status, "posted"),
            gte(posts.postedAt, startThis),
            lte(posts.postedAt, endThis),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(
          and(
            eq(posts.status, "posted"),
            gte(posts.postedAt, startPrior),
            lte(posts.postedAt, endPrior),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(
          and(
            inArray(posts.status, ["scheduled", "ready_to_post"]),
            gte(posts.scheduledFor, now),
            lte(posts.scheduledFor, next7End),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.status, "ready_to_post")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(eq(posts.isEvergreen, true), eq(posts.status, "posted"))),
      db.select({ count: sql<number>`count(*)` }).from(apps),
    ]);

  return {
    shippedThisRange: Number(shippedThisRow[0]?.count ?? 0),
    shippedPriorRange: Number(shippedPriorRow[0]?.count ?? 0),
    scheduledNext7d: Number(scheduledRow[0]?.count ?? 0),
    readyCount: Number(readyRow[0]?.count ?? 0),
    evergreenPool: Number(evergreenRow[0]?.count ?? 0),
    activeApps: Number(appsRow[0]?.count ?? 0),
  };
}

export type DashboardInsight = {
  id: string;
  tone: "info" | "warning" | "success";
  title: string;
  detail: string;
  href?: string;
  cta?: string;
};

export async function getDashboardInsights(): Promise<DashboardInsight[]> {
  const [coverage, kpis, today, ready, campaigns] = await Promise.all([
    getAppCoverage(),
    getDashboardKpis(30),
    getTodaysScheduled(),
    getReadyToPost(),
    getCampaignProgress(),
  ]);

  const insights: DashboardInsight[] = [];

  const overdue = coverage
    .filter((a) => (a.daysSinceLastPost ?? 0) >= 7)
    .sort(
      (a, b) => (b.daysSinceLastPost ?? 0) - (a.daysSinceLastPost ?? 0),
    )
    .slice(0, 1)[0];
  if (overdue) {
    insights.push({
      id: `overdue-${overdue.id}`,
      tone: "warning",
      title: `${overdue.name} hasn't shipped in ${overdue.daysSinceLastPost} days`,
      detail: "Schedule a quick post to keep cadence steady.",
      href: `/queue?app=${overdue.id}`,
      cta: "Plan a post",
    });
  }

  if (ready.length > 0) {
    insights.push({
      id: "ready-handoff",
      tone: "info",
      title: `${ready.length} ${ready.length === 1 ? "post is" : "posts are"} ready to hand off`,
      detail: "Open the queue to copy and post in one tap.",
      href: "/queue?status=ready",
      cta: "Open queue",
    });
  }

  if (today.length > 0) {
    insights.push({
      id: "today",
      tone: "info",
      title: `${today.length} scheduled for today`,
      detail: "Review timing or add a launch-day note.",
      href: "/queue",
    });
  }

  const delta = kpis.shippedThisRange - kpis.shippedPriorRange;
  if (kpis.shippedPriorRange > 0 && delta < 0 && Math.abs(delta) >= 2) {
    insights.push({
      id: "shipping-down",
      tone: "warning",
      title: `Shipping is down ${Math.abs(delta)} vs the previous 30 days`,
      detail: "Try Batch compose to refill the queue in 10 minutes.",
      href: "/compose/batch",
      cta: "Open Batch",
    });
  } else if (delta > 0 && kpis.shippedThisRange >= 5) {
    insights.push({
      id: "shipping-up",
      tone: "success",
      title: `You shipped ${kpis.shippedThisRange} posts this month — up ${delta}`,
      detail: "Keep the momentum: schedule another batch.",
      href: "/compose/batch",
    });
  }

  const behindCampaign = campaigns
    .filter(
      (c) =>
        c.planned > 0 &&
        c.postedCount / c.planned < 0.5 &&
        c.postedCount < c.planned,
    )
    .sort((a, b) => a.postedCount / a.planned - b.postedCount / b.planned)[0];
  if (behindCampaign) {
    const pct = Math.round(
      (behindCampaign.postedCount / behindCampaign.planned) * 100,
    );
    insights.push({
      id: `campaign-${behindCampaign.campaign.id}`,
      tone: "warning",
      title: `${behindCampaign.campaign.name} at ${pct}% of plan`,
      detail: `${behindCampaign.postedCount} of ${behindCampaign.planned} posts shipped.`,
      href: "/apps",
      cta: "Open campaigns",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "all-clear",
      tone: "success",
      title: "You're caught up",
      detail: "No urgent actions. Use this calm to draft something evergreen.",
      href: "/compose",
      cta: "Compose",
    });
  }

  return insights.slice(0, 4);
}

/* ----------------------------------------------------------------------------
 * Helpers used by the v2 dashboard.
 * ----------------------------------------------------------------------------*/

export type CalendarDay = {
  date: Date;
  iso: string; // YYYY-MM-DD
  weekday: string; // "Mon"
  day: number;
  isToday: boolean;
  queued: number;
  posted: number;
  draft: number;
};

/**
 * Build a 7-day calendar window starting on Monday of the current week.
 */
export async function getWeekCalendar(now = new Date()): Promise<CalendarDay[]> {
  const db = getDb();
  const start = new Date(now);
  // Snap back to Monday (weekday 1; Sunday is 0).
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const rows = await db
    .select({
      status: posts.status,
      scheduledFor: posts.scheduledFor,
      postedAt: posts.postedAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts);

  function bucketKey(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  const days: CalendarDay[] = [];
  const todayKey = bucketKey(now);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d,
      iso: bucketKey(d),
      weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      day: d.getDate(),
      isToday: bucketKey(d) === todayKey,
      queued: 0,
      posted: 0,
      draft: 0,
    });
  }
  const byKey = new Map(days.map((d) => [d.iso, d]));

  for (const r of rows) {
    if (r.status === "posted" && r.postedAt) {
      const key = bucketKey(new Date(r.postedAt));
      const cell = byKey.get(key);
      if (cell) cell.posted += 1;
      continue;
    }
    if (
      (r.status === "scheduled" || r.status === "ready_to_post") &&
      r.scheduledFor
    ) {
      const key = bucketKey(new Date(r.scheduledFor));
      const cell = byKey.get(key);
      if (cell) cell.queued += 1;
      continue;
    }
    if (r.status === "draft") {
      const key = bucketKey(new Date(r.updatedAt));
      const cell = byKey.get(key);
      if (cell) cell.draft += 1;
    }
  }

  return days;
}

/**
 * Posts to surface in the hand-off walkthrough: everything in
 * `ready_to_post` plus anything scheduled in the next `withinHours` hours.
 */
export async function listHandoffCandidates(withinHours = 12) {
  const db = getDb();
  const now = new Date();
  const cutoff = new Date(now.getTime() + withinHours * 3600 * 1000);
  return db
    .select()
    .from(posts)
    .where(
      and(
        inArray(posts.status, ["ready_to_post", "scheduled"]),
        // We pre-filter ready_to_post regardless of scheduledFor; the SQL
        // below filters scheduled rows by their time. Compose the OR client-side.
      ),
    )
    .orderBy(asc(posts.scheduledFor))
    .then((rows) =>
      rows.filter((p) => {
        if (p.status === "ready_to_post") return true;
        if (!p.scheduledFor) return false;
        const t = new Date(p.scheduledFor).getTime();
        return t <= cutoff.getTime();
      }),
    );
}

export async function getRecentDrafts(limit = 6) {
  const db = getDb();
  return db
    .select()
    .from(posts)
    .where(eq(posts.status, "draft"))
    .orderBy(desc(posts.updatedAt))
    .limit(limit);
}

/**
 * "Confidence Pass" surfaces posts that need a final review before going out:
 * everything in `ready_to_post` plus anything scheduled within the next 24h
 * that hasn't been marked ready yet.
 */
export async function getConfidencePassCount(): Promise<number> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.status, "ready_to_post"));
  return Number(count);
}

/**
 * Mock per-platform metrics, shaped like what we'll receive from real APIs.
 * The dashboard renders a "Sample data" disclaimer so this is honest for now.
 */
export type DashboardMetricCard = {
  id: string;
  label: string;
  iconName: string;
  value: number;
  deltaPct: number;
  color: string;
  series: number[];
};

export function getSampleMetrics(): DashboardMetricCard[] {
  return [
    {
      id: "reach",
      label: "Total reach",
      iconName: "UsersThree",
      value: 42700,
      deltaPct: 18,
      color: "var(--violet-500)",
      series: [12, 18, 15, 22, 19, 28, 34, 31, 40, 36, 42, 47],
    },
    {
      id: "engagement",
      label: "Engagement",
      iconName: "Heart",
      value: 3200,
      deltaPct: 24,
      color: "var(--pink-500)",
      series: [8, 11, 9, 14, 18, 15, 22, 20, 26, 24, 30, 32],
    },
    {
      id: "profile-clicks",
      label: "Profile clicks",
      iconName: "Eye",
      value: 812,
      deltaPct: 16,
      color: "#3b82f6",
      series: [3, 4, 6, 5, 7, 9, 8, 12, 10, 14, 13, 16],
    },
    {
      id: "link-clicks",
      label: "Link clicks",
      iconName: "LinkSimple",
      value: 324,
      deltaPct: 31,
      color: "#10b981",
      series: [2, 3, 2, 5, 4, 6, 5, 9, 7, 12, 14, 18],
    },
    {
      id: "followers",
      label: "New followers",
      iconName: "Sparkle",
      value: 186,
      deltaPct: 15,
      color: "#f59e0b",
      series: [4, 6, 5, 8, 9, 11, 10, 14, 13, 17, 16, 19],
    },
  ];
}
