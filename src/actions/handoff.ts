"use server";

import { eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { apps, postMedia, posts, postVariants } from "@/db/schema";
import { PLATFORMS, type PlatformId } from "@/lib/constants";

export type HandoffPayload = {
  content: string;
  appUrl: string | null;
  appName: string | null;
  media: { url: string; alt: string }[];
};

/**
 * Gather everything the client needs to hand a post off to a single platform:
 * the platform-specific variant content (or base content as fallback),
 * the app's marketing URL (used by share-style platforms), and any media URLs
 * (used by Instagram / TikTok hand-offs).
 */
export async function prepareHandoff(
  postId: string,
  platform: string,
): Promise<{ ok: true; data: HandoffPayload } | { ok: false; error: string }> {
  if (!(PLATFORMS as readonly string[]).includes(platform)) {
    return { ok: false, error: "Unknown platform." };
  }
  const db = getDb();

  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) return { ok: false, error: "Post not found." };

  const [variant] = await db
    .select()
    .from(postVariants)
    .where(
      and(
        eq(postVariants.postId, postId),
        eq(postVariants.platform, platform as PlatformId),
      ),
    );

  const [app] = await db.select().from(apps).where(eq(apps.id, post.appId));

  const media = await db
    .select({ url: postMedia.blobUrl, alt: postMedia.altText })
    .from(postMedia)
    .where(eq(postMedia.postId, postId));

  return {
    ok: true,
    data: {
      content: (variant?.content?.trim() || post.baseContent || "").trim(),
      appUrl: app?.url ?? null,
      appName: app?.name ?? null,
      media,
    },
  };
}
