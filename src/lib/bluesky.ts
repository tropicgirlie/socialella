/**
 * Bluesky publish helper using the AT Protocol API.
 *
 * Solo-user MVP: we store the user's handle + app password in the
 * `accountConnections` table. App passwords can be created at
 * https://bsky.app/settings/app-passwords and are scoped per-app.
 *
 * Wiring this up to the actual queue is intentionally a separate step —
 * this module just gives us a typed, testable function to call when we're
 * ready to flip from hand-off to direct publish.
 */
import { AtpAgent, RichText } from "@atproto/api";

export type BlueskyCreds = {
  identifier: string; // handle, e.g. "alice.bsky.social"
  password: string; // app password (NOT the main account password)
};

export type PublishResult =
  | { ok: true; uri: string; cid: string }
  | { ok: false; error: string };

const SERVICE = "https://bsky.social";

/** Quick check that creds are valid without sending a post. */
export async function verifyBlueskyCreds(
  creds: BlueskyCreds,
): Promise<PublishResult> {
  const agent = new AtpAgent({ service: SERVICE });
  try {
    const session = await agent.login(creds);
    if (!session.success) {
      return { ok: false, error: "Login failed." };
    }
    return { ok: true, uri: session.data.did, cid: session.data.handle };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not reach Bluesky.",
    };
  }
}

/** Publish a single text post to Bluesky. */
export async function publishToBluesky(
  creds: BlueskyCreds,
  text: string,
): Promise<PublishResult> {
  if (!text.trim()) return { ok: false, error: "Empty post." };

  const agent = new AtpAgent({ service: SERVICE });
  try {
    const session = await agent.login(creds);
    if (!session.success) {
      return { ok: false, error: "Login failed." };
    }

    // RichText handles facets — links, mentions, etc. — so the post renders
    // correctly on the Bluesky client.
    const rt = new RichText({ text: text.trim() });
    await rt.detectFacets(agent);

    const result = await agent.post({
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString(),
    });

    return { ok: true, uri: result.uri, cid: result.cid };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not publish to Bluesky.",
    };
  }
}
