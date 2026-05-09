"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { accountConnections } from "@/db/schema";
import { verifyBlueskyCreds } from "@/lib/bluesky";

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
