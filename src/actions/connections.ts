"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import {
  accountConnections,
  postVariants,
  posts,
  scheduleRuns,
} from "@/db/schema";
import { publishToBluesky, verifyBlueskyCreds } from "@/lib/bluesky";

const blueskySchema = z.object({
  identifier: z.string().trim().min(3, "Add your handle, e.g. alice.bsky.social"),
  password: z
    .string()
    .min(8, "Use a Bluesky app password (Settings → App Passwords)."),
});

export async function connectBluesky(input: {
  identifier: string;
  password: string;
}) {
  const parsed = blueskySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const verify = await verifyBlueskyCreds(parsed.data);
  if (!verify.ok) {
    return { error: verify.error };
  }

  const db = getDb();
  // Replace any existing Bluesky connection — single solo user, single account.
  await db
    .delete(accountConnections)
    .where(eq(accountConnections.platform, "bluesky"));

  await db.insert(accountConnections).values({
    platform: "bluesky",
    identifier: parsed.data.identifier,
    secret: parsed.data.password,
    metadata: { service: "https://bsky.social" },
    status: "connected",
  });

  revalidatePath("/connections");
  return { ok: true as const, identifier: parsed.data.identifier };
}

export async function disconnectBluesky() {
  const db = getDb();
  await db
    .delete(accountConnections)
    .where(eq(accountConnections.platform, "bluesky"));
  revalidatePath("/connections");
  return { ok: true as const };
}

export async function getBlueskyConnection() {
  const db = getDb();
  const [row] = await db
    .select()
    .from(accountConnections)
    .where(
      and(
        eq(accountConnections.platform, "bluesky"),
        eq(accountConnections.status, "connected"),
      ),
    )
    .limit(1);
  return row
    ? { identifier: row.identifier, lastUsedAt: row.lastUsedAt }
    : null;
}

/**
 * Publish a post to Bluesky using the stored connection.
 * On success, marks the post as posted and stamps lastUsedAt on the
 * connection. Returns the AT-Protocol URI so we can deep-link later.
 */
export async function publishPostToBluesky(postId: string): Promise<
  | { ok: true; uri: string }
  | { ok: false; error: string }
> {
  const db = getDb();

  const [conn] = await db
    .select()
    .from(accountConnections)
    .where(
      and(
        eq(accountConnections.platform, "bluesky"),
        eq(accountConnections.status, "connected"),
      ),
    )
    .limit(1);

  if (!conn?.secret) {
    return {
      ok: false,
      error: "Connect Bluesky in /connections first.",
    };
  }

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return { ok: false, error: "Post not found." };

  // Prefer the Bluesky-specific variant if it exists, otherwise fall back
  // to the base content. This keeps tone-per-platform coherent.
  const [variant] = await db
    .select()
    .from(postVariants)
    .where(
      and(
        eq(postVariants.postId, postId),
        eq(postVariants.platform, "bluesky"),
      ),
    );
  const text = (variant?.content?.trim() || post.baseContent || "").trim();
  if (!text) return { ok: false, error: "This post has no content yet." };

  const result = await publishToBluesky(
    { identifier: conn.identifier, password: conn.secret },
    text,
  );

  if (!result.ok) {
    await db.insert(scheduleRuns).values({
      postId,
      outcome: `bluesky_error:${result.error}`,
    });
    return { ok: false, error: result.error };
  }

  // Mark the post as posted and stamp the connection's last-used time.
  const now = new Date();
  await db
    .update(posts)
    .set({ status: "posted", postedAt: now, updatedAt: now })
    .where(eq(posts.id, postId));
  await db
    .update(accountConnections)
    .set({ lastUsedAt: now })
    .where(eq(accountConnections.id, conn.id));
  await db.insert(scheduleRuns).values({
    postId,
    outcome: `bluesky_published:${result.uri}`,
  });

  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return { ok: true, uri: result.uri };
}
