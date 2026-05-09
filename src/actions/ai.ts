"use server";

import { generateText } from "ai";
import type { PlatformId } from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/constants";

/**
 * Model used for tone rewrites. We route through the Vercel AI Gateway by
 * default — `AI_GATEWAY_API_KEY` is the only env you need locally. Override
 * the model string with `AI_REWRITE_MODEL` if you want something different.
 *
 * No provider package is required at runtime: with AI SDK v6 a plain
 * `"<provider>/<model>"` string is routed through the gateway automatically.
 */
const REWRITE_MODEL = process.env.AI_REWRITE_MODEL ?? "openai/gpt-4o-mini";

type RewriteOk = { ok: true; text: string };
type RewriteSkipped = { skipped: true; reason: string };
type RewriteFailed = { error: string };
export type RewriteResult = RewriteOk | RewriteSkipped | RewriteFailed;

export async function aiRewriteVariant(input: {
  base: string;
  platform: PlatformId;
  tone: string;
}): Promise<RewriteResult> {
  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  if (!hasGateway && !hasOpenAI) {
    return {
      skipped: true,
      reason:
        "Add AI_GATEWAY_API_KEY (or OPENAI_API_KEY) to enable AI rewrites.",
    };
  }
  const base = input.base?.trim();
  if (!base) {
    return { skipped: true, reason: "Write a draft first, then I'll rewrite it." };
  }

  const label = PLATFORM_LABELS[input.platform];
  const prompt = `Rewrite the following social post for ${label}.
Tone: ${input.tone}.
Rules:
- Keep the author's intent, voice, and facts.
- Stay within ${platformCharLimit(input.platform)} characters.
- Don't add hashtags unless the original has them.
- Output only the post text. No quotes, no preamble.

---
${base}`;

  try {
    const { text } = await generateText({
      model: REWRITE_MODEL,
      prompt,
    });
    return { ok: true, text: text.trim() };
  } catch (err) {
    console.error("[aiRewriteVariant] failed", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "Something went wrong calling the AI gateway.",
    };
  }
}

function platformCharLimit(p: PlatformId): number {
  switch (p) {
    case "x":
      return 280;
    case "bluesky":
      return 300;
    case "threads":
      return 500;
    case "linkedin":
      return 3000;
    case "instagram":
      return 2200;
    case "tiktok":
      return 2200;
    case "facebook":
      return 5000;
    default:
      return 1000;
  }
}
