import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userSettings } from "@/db/schema";

export async function ensureUserSettings() {
  const db = getDb();
  const existing = await db.select().from(userSettings).limit(1);
  if (existing[0]) return existing[0];
  await db
    .insert(userSettings)
    .values({ id: 1 })
    .onConflictDoNothing({ target: userSettings.id });
  const [row] = await db.select().from(userSettings).where(eq(userSettings.id, 1));
  return row!;
}
