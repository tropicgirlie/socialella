import type { PlatformId } from "@/lib/constants";

/**
 * How Socialella hands a draft off to each platform.
 *
 * - `intent`: the platform supports a URL that pre-fills the composer with text.
 *   We open that URL in a new tab; the user just reviews and posts.
 * - `share`: the platform supports a share dialog that needs a URL to share.
 *   We open that URL in a new tab.
 * - `compose-paste`: the platform's composer can't be pre-filled, but we can
 *   deep-link to the new-post page. We always copy the caption to clipboard
 *   first so the user can immediately paste it.
 * - `manual`: no pre-fill at all; this platform requires the user to open
 *   their own app (usually mobile-only). We copy the caption + download media,
 *   and provide a deep-link / instructions.
 */
export type HandoffMethod =
  | {
      kind: "intent";
      url: string;
      description: string;
      requiresMedia?: boolean;
    }
  | {
      kind: "share";
      url: string;
      description: string;
      requiresUrl?: boolean;
    }
  | {
      kind: "compose-paste";
      url: string;
      description: string;
    }
  | {
      kind: "manual";
      description: string;
      mobileScheme?: string;
      desktopUrl?: string;
      requiresMedia?: boolean;
    };

const enc = (s: string) => encodeURIComponent(s);

/**
 * Given a platform, the post text, and (optionally) the app's marketing URL,
 * return the best hand-off method.
 *
 * `appUrl` is used by share-style platforms (Facebook, Pinterest) that won't
 * share text without a URL. If you don't have one, those fall back to manual.
 */
export function getHandoff(
  platform: PlatformId,
  content: string,
  appUrl?: string,
): HandoffMethod {
  const text = content.trim();

  switch (platform) {
    case "x":
      return {
        kind: "intent",
        url: `https://x.com/intent/post?text=${enc(text)}`,
        description: "Opens X with your text pre-filled. Review and post.",
      };

    case "threads":
      return {
        kind: "intent",
        url: `https://www.threads.net/intent/post?text=${enc(text)}`,
        description: "Opens Threads with your text pre-filled.",
      };

    case "bluesky":
      return {
        kind: "intent",
        url: `https://bsky.app/intent/compose?text=${enc(text)}`,
        description: "Opens Bluesky with your text pre-filled.",
      };

    case "linkedin":
      // LinkedIn's share-text param has been unreliable for years.
      // Most reliable path: open the new-post composer; we already copied the
      // caption to the clipboard, user pastes immediately.
      return {
        kind: "compose-paste",
        url: "https://www.linkedin.com/post/new/",
        description:
          "Opens LinkedIn's composer. Caption is on your clipboard — paste with ⌘V / Ctrl+V.",
      };

    case "facebook":
      if (appUrl) {
        return {
          kind: "share",
          url: `https://www.facebook.com/sharer/sharer.php?u=${enc(appUrl)}&quote=${enc(text)}`,
          description: "Opens Facebook share dialog with your app link.",
        };
      }
      return {
        kind: "compose-paste",
        url: "https://www.facebook.com/",
        description:
          "Facebook can't share text-only via URL. Add a marketing URL to your app, or paste manually from your clipboard.",
      };

    case "pinterest":
      if (appUrl) {
        return {
          kind: "share",
          url: `https://pinterest.com/pin-builder/?url=${enc(appUrl)}&description=${enc(text)}`,
          description: "Opens Pinterest pin builder pre-filled.",
          requiresUrl: true,
        };
      }
      return {
        kind: "compose-paste",
        url: "https://www.pinterest.com/pin-builder/",
        description:
          "Pinterest needs a URL to pin. Add one to your app, or paste manually.",
      };

    case "mastodon":
      // No universal share URL works without knowing the user's instance.
      return {
        kind: "manual",
        description:
          "Mastodon shares per-instance. Open your home instance, paste from clipboard.",
        desktopUrl: "https://joinmastodon.org/servers",
      };

    case "instagram":
      return {
        kind: "manual",
        description:
          "Instagram blocks pre-filled web composers. On mobile: tap below to open IG, then paste your caption. On desktop: download the media files and post from the IG app.",
        mobileScheme: "instagram://camera",
        desktopUrl: "https://www.instagram.com/",
        requiresMedia: true,
      };

    case "tiktok":
      return {
        kind: "manual",
        description:
          "TikTok requires posting from the app or TikTok Studio. Download media + paste your caption.",
        mobileScheme: "snssdk1233://",
        desktopUrl: "https://www.tiktok.com/upload",
        requiresMedia: true,
      };

    default:
      return {
        kind: "manual",
        description: "Open the platform manually and paste from clipboard.",
      };
  }
}

/** Legacy helper kept for callers that only need a URL string. */
export function getComposerDeepLink(
  platform: PlatformId,
  draft?: string,
  appUrl?: string,
): string {
  const handoff = getHandoff(platform, draft ?? "", appUrl);
  if (handoff.kind === "intent" || handoff.kind === "share") return handoff.url;
  if (handoff.kind === "compose-paste") return handoff.url;
  return handoff.desktopUrl ?? "#";
}

/**
 * Whether the platform's hand-off URL alone is enough — no clipboard / media
 * gymnastics needed. Useful for showing a simpler UI on platforms like X.
 */
export function handoffIsOneClick(platform: PlatformId): boolean {
  return platform === "x" || platform === "threads" || platform === "bluesky";
}

/**
 * Whether the platform fundamentally needs media (video / image) to post.
 * Used to warn the user when they hand off without uploading media first.
 */
export function platformRequiresMedia(platform: PlatformId): boolean {
  return platform === "instagram" || platform === "tiktok";
}
