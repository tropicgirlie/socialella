import { Resend } from "resend";
import { getReadyToPost } from "@/lib/data";
import { ensureUserSettings } from "@/lib/settings";

export async function sendDigestIfConfigured() {
  const settings = await ensureUserSettings();
  if (!settings.digestEnabled || !settings.digestEmail) {
    return { sent: false as const, reason: "digest_disabled" };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { sent: false as const, reason: "missing_resend" };
  }
  const ready = await getReadyToPost();
  if (!ready.length) {
    return { sent: false as const, reason: "empty_queue" };
  }

  const resend = new Resend(key);
  const from =
    process.env.RESEND_FROM ?? "Socialella <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to: settings.digestEmail,
    subject: `Socialella — ${ready.length} ready to post`,
    text: ready
      .map((p, i) => `#${i + 1}\n${p.baseContent}`)
      .join("\n\n---\n\n"),
  });

  return { sent: true as const };
}
