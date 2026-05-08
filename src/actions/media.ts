"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { getDb } from "@/db";
import { postMedia } from "@/db/schema";
import { stripExifFromBuffer } from "@/lib/exif";

export async function uploadPostMedia(postId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  const alt = String(formData.get("alt") ?? "").trim();
  if (!file || file.size === 0) {
    return { error: "Choose an image file." };
  }
  if (!alt) {
    return { error: "Alt text is required for accessibility." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const stripped = await stripExifFromBuffer(buf);
  const filename = `posts/${postId}/${Date.now()}.jpg`;
  const blob = await put(filename, stripped, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  const db = getDb();
  await db.insert(postMedia).values({
    postId,
    blobUrl: blob.url,
    altText: alt,
    exifStripped: true,
  });
  revalidatePath("/compose");
  return { ok: true as const };
}

export async function deleteMedia(mediaId: string) {
  const db = getDb();
  await db.delete(postMedia).where(eq(postMedia.id, mediaId));
  revalidatePath("/compose");
  return { ok: true as const };
}
