import {
  AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const apps = pgTable("apps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#0891b2"),
  icon: text("icon").notNull().default("RocketLaunch"),
  url: text("url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  appId: uuid("app_id")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  goal: text("goal"),
  plannedPostCount: integer("planned_post_count").default(0),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  appId: uuid("app_id")
    .references(() => apps.id, { onDelete: "cascade" })
    .notNull(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "set null",
  }),
  status: text("status").notNull().default("draft"),
  baseContent: text("base_content").notNull().default(""),
  founderChecklistJson: jsonb("founder_checklist_json")
    .$type<Record<string, boolean>>()
    .default({}),
  isEvergreen: boolean("is_evergreen").notNull().default(false),
  energyTag: text("energy_tag"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  lastResurfacedAt: timestamp("last_resurfaced_at", { withTimezone: true }),
  evergreenSourceId: uuid("evergreen_source_id").references(
    (): AnyPgColumn => posts.id,
    { onDelete: "set null" },
  ),
  launchDayMode: boolean("launch_day_mode").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const postVariants = pgTable("post_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  platform: text("platform").notNull(),
  content: text("content").notNull().default(""),
  tone: text("tone").notNull().default("raw"),
});

export const postMedia = pgTable("post_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  blobUrl: text("blob_url").notNull(),
  altText: text("alt_text").notNull(),
  exifStripped: boolean("exif_stripped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const scheduleRuns = pgTable("schedule_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  ranAt: timestamp("ran_at", { withTimezone: true }).defaultNow().notNull(),
  outcome: text("outcome").notNull(),
});

export const energySlots = pgTable("energy_slots", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekday: text("weekday").notNull(),
  startMinutes: integer("start_minutes").notNull(),
  endMinutes: integer("end_minutes").notNull(),
  energy: text("energy").notNull(),
});

export const safetyClips = pgTable("safety_clips", {
  id: uuid("id").defaultRandom().primaryKey(),
  capturedAt: timestamp("captured_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  platform: text("platform").notNull(),
  screenshotBlobUrl: text("screenshot_blob_url"),
  reporterUrl: text("reporter_url"),
  note: text("note"),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "set null" }),
});

/**
 * Per-platform account connections. For Bluesky this stores the user's
 * `identifier` (handle) and an app password ref (we hold the value in
 * `secret` for the solo-user MVP, with a clear migration path to a
 * managed secret store later).
 */
export const accountConnections = pgTable("account_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  platform: text("platform").notNull(), // matches PlatformId
  identifier: text("identifier").notNull(),
  secret: text("secret"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  status: text("status").notNull().default("connected"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const userSettings = pgTable("user_settings", {
  id: integer("id").primaryKey().default(1),
  digestEnabled: boolean("digest_enabled").notNull().default(false),
  digestEmail: text("digest_email"),
  evergreenCooldownDays: integer("evergreen_cooldown_days").notNull().default(14),
  evergreenBatchSize: integer("evergreen_batch_size").notNull().default(2),
  energySchedulingEnabled: boolean("energy_scheduling_enabled")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appsRelations = relations(apps, ({ many }) => ({
  campaigns: many(campaigns),
  posts: many(posts),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  app: one(apps, {
    fields: [campaigns.appId],
    references: [apps.id],
  }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  app: one(apps, {
    fields: [posts.appId],
    references: [apps.id],
  }),
  campaign: one(campaigns, {
    fields: [posts.campaignId],
    references: [campaigns.id],
  }),
  variants: many(postVariants),
  media: many(postMedia),
  scheduleRuns: many(scheduleRuns),
}));

export const postVariantsRelations = relations(postVariants, ({ one }) => ({
  post: one(posts, {
    fields: [postVariants.postId],
    references: [posts.id],
  }),
}));

export const postMediaRelations = relations(postMedia, ({ one }) => ({
  post: one(posts, {
    fields: [postMedia.postId],
    references: [posts.id],
  }),
}));
