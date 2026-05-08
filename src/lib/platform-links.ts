import type { PlatformId } from "@/lib/constants";

/** Deep links to native compose UIs (best-effort; users still paste manually in v1). */
export function getComposerDeepLink(platform: PlatformId, draft?: string): string {
  const encoded = draft ? encodeURIComponent(draft) : "";
  switch (platform) {
    case "x":
      return `https://twitter.com/intent/tweet?text=${encoded}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encoded}`;
    case "bluesky":
      return "https://bsky.app/";
    case "mastodon":
      return "https://joinmastodon.org/servers";
    case "instagram":
      return "https://www.instagram.com/";
    case "facebook":
      return "https://www.facebook.com/";
    case "threads":
      return "https://www.threads.net/";
    case "tiktok":
      return "https://www.tiktok.com/upload";
    case "pinterest":
      return "https://www.pinterest.com/pin-builder/";
    default:
      return "#";
  }
}
