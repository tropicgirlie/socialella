"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { PlatformId } from "@/lib/constants";
import { PLATFORM_LABELS } from "@/lib/constants";

export async function aiRewriteVariant(input: {
  base: string;
  platform: PlatformId;
  tone: string;
}) {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;
  if (!gatewayKey && !openAIKey) {
    return { skipped: true as const, reason: "No AI API key configured." };
  }

  const baseURL = gatewayKey
    ? (process.env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1")
    : undefined;

  const openai = createOpenAI({
    apiKey: gatewayKey ?? openAIKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const label = PLATFORM_LABELS[input.platform];

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `Rewrite the following social post for ${label}. Tone: ${input.tone}. Keep the author's intent and facts. Do not add hashtags unless present. Output only the post text, no quotes.\n\n---\n${input.base}`,
  });

  return { ok: true as const, text: text.trim() };
}
