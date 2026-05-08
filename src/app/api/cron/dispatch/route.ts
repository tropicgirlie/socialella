import { NextResponse } from "next/server";
import {
  dispatchScheduledPosts,
  resurfaceEvergreenPosts,
} from "@/lib/cron-dispatch";
import { sendDigestIfConfigured } from "@/lib/digest";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const moved = await dispatchScheduledPosts();
  const resurfaced = await resurfaceEvergreenPosts();
  const digest = await sendDigestIfConfigured();

  return NextResponse.json({
    ok: true,
    moved,
    resurfaced,
    digest,
  });
}
