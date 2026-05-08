"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import { z } from "zod";
import { getDb } from "@/db";
import { safetyClips } from "@/db/schema";

const clipSchema = z.object({
  platform: z.string().min(1).max(80),
  reporterUrl: z.string().url().optional().or(z.literal("")),
  note: z.string().max(8000).optional().or(z.literal("")),
});

export async function createSafetyClip(formData: FormData) {
  const parsed = clipSchema.safeParse({
    platform: formData.get("platform"),
    reporterUrl: formData.get("reporterUrl") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const file = formData.get("screenshot") as File | null;
  let screenshotBlobUrl: string | null = null;
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const filename = `safety/${Date.now()}-${file.name.replace(/[^\w.-]/g, "")}`;
    const blob = await put(filename, buf, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    screenshotBlobUrl = blob.url;
  }
  const db = getDb();
  await db.insert(safetyClips).values({
    platform: parsed.data.platform,
    reporterUrl: parsed.data.reporterUrl || null,
    note: parsed.data.note || null,
    screenshotBlobUrl,
  });
  revalidatePath("/safety");
  return { ok: true as const };
}

export async function deleteSafetyClip(id: string) {
  const db = getDb();
  await db.delete(safetyClips).where(eq(safetyClips.id, id));
  revalidatePath("/safety");
  return { ok: true as const };
}
