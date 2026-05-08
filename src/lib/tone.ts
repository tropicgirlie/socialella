import type { PlatformId } from "@/lib/constants";
import type { TonePreset } from "@/lib/constants";

/** Rule-based tone shaping when AI Gateway is unavailable. */
export function applyTonePreset(
  base: string,
  platform: PlatformId,
  tone: TonePreset,
): string {
  const trimmed = base.trim();
  if (!trimmed) return "";

  let out = trimmed;

  if (tone === "raw") {
    return out;
  }

  if (tone === "pro") {
    out = formalize(trimmed);
    if (platform === "linkedin") {
      out = ensureOpeningHook(out);
    }
    return out;
  }

  if (tone === "punchy") {
    out = shortenSentences(trimmed);
    out = out.replace(/\.$/, "");
    if (!/[?!]$/u.test(out)) out += ".";
    return out;
  }

  if (tone === "warm") {
    out = trimmed;
    if (!/^hey\b|^hi\b|^hello\b/i.test(out)) {
      out = `Hey — ${decapitalize(out)}`;
    }
    return out;
  }

  return out;
}

export function defaultToneForPlatform(platform: PlatformId): TonePreset {
  switch (platform) {
    case "linkedin":
      return "pro";
    case "x":
      return "punchy";
    case "instagram":
    case "threads":
      return "warm";
    default:
      return "raw";
  }
}

function formalize(s: string): string {
  return s.replace(/\bi\b/g, "I").replace(/\s+/g, " ");
}

function ensureOpeningHook(s: string): string {
  if (s.length < 120) return s;
  const first = s.slice(0, 140);
  if (!first.includes("\n")) {
    return `${first}\n\n${s.slice(140)}`;
  }
  return s;
}

function shortenSentences(s: string): string {
  const parts = s.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, 3).join(" ");
}

function decapitalize(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
