import type { PlatformId } from "@/lib/constants";

/**
 * Describes what's possible for each platform in Socialella today and what
 * it would take to upgrade from "hand-off" to fully automatic posting.
 */
export type ConnectionTier =
  | "free-credentials" // user pastes an app password / token; we post directly
  | "free-review" // platform's API is free but requires app review
  | "paid-api" // platform's API costs money (X)
  | "no-public-api"; // no public auto-post API at all

export type ConnectionInfo = {
  platform: PlatformId;
  label: string;
  /** Always true today — every platform supports the hand-off model. */
  handoffActive: true;
  upgradeTier: ConnectionTier;
  upgradeCost: string;
  upgradeTime: string;
  upgradeNotes: string;
  accent: "rose" | "lemon" | "mint" | "peach" | "sky";
};

export const CONNECTION_INFO: ConnectionInfo[] = [
  {
    platform: "x",
    label: "X / Twitter",
    handoffActive: true,
    upgradeTier: "paid-api",
    upgradeCost: "$100/month (X API — Basic tier)",
    upgradeTime: "~1 day to integrate after billing is set up",
    upgradeNotes:
      "Hand-off works very well here — `x.com/intent/post` pre-fills the composer. Auto-post is only worth the $100/mo if you post several times a day.",
    accent: "rose",
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    handoffActive: true,
    upgradeTier: "free-review",
    upgradeCost: "Free — requires Marketing Developer Platform app review",
    upgradeTime: "1–3 weeks for LinkedIn to approve the app",
    upgradeNotes:
      "Free auto-post is possible for personal posts and Pages. LinkedIn approves apps individually — submit when you're ready.",
    accent: "sky",
  },
  {
    platform: "instagram",
    label: "Instagram",
    handoffActive: true,
    upgradeTier: "free-review",
    upgradeCost: "Free — requires Meta app review + IG Business / Creator account",
    upgradeTime: "2–4 weeks (Meta App Review)",
    upgradeNotes:
      "Auto-post requires an Instagram Business or Creator account linked to a Facebook Page, plus Meta's Graph API review. Hand-off is your best path until that's approved.",
    accent: "rose",
  },
  {
    platform: "tiktok",
    label: "TikTok",
    handoffActive: true,
    upgradeTier: "free-review",
    upgradeCost: "Free — requires TikTok dev review",
    upgradeTime: "2–4 weeks",
    upgradeNotes:
      "TikTok's Content Posting API is approval-gated and posts videos only. Captions need to be added inside TikTok after upload.",
    accent: "mint",
  },
  {
    platform: "threads",
    label: "Threads",
    handoffActive: true,
    upgradeTier: "free-review",
    upgradeCost: "Free — Meta Threads API",
    upgradeTime: "2–4 weeks (shared Meta review)",
    upgradeNotes:
      "Threads inherits Meta's review process. Hand-off via `threads.net/intent/post` works today.",
    accent: "peach",
  },
  {
    platform: "facebook",
    label: "Facebook",
    handoffActive: true,
    upgradeTier: "free-review",
    upgradeCost: "Free — Meta Graph API + Page admin",
    upgradeTime: "1–3 weeks",
    upgradeNotes:
      "Auto-post requires a Facebook Page (not a personal profile) and Meta App Review for the `pages_manage_posts` permission.",
    accent: "sky",
  },
  {
    platform: "pinterest",
    label: "Pinterest",
    handoffActive: true,
    upgradeTier: "free-review",
    upgradeCost: "Free — Pinterest dev app + review",
    upgradeTime: "1–2 weeks",
    upgradeNotes:
      "Pinterest needs a URL on every pin — add a marketing URL to each app under Apps to unlock the pre-filled hand-off.",
    accent: "rose",
  },
  {
    platform: "bluesky",
    label: "Bluesky",
    handoffActive: true,
    upgradeTier: "free-credentials",
    upgradeCost: "Free — paste an app password",
    upgradeTime: "~30 minutes once you generate the app password",
    upgradeNotes:
      "Bluesky's AT Protocol is open. You generate an app password in Bluesky settings, paste it here, and Socialella can post for you.",
    accent: "sky",
  },
  {
    platform: "mastodon",
    label: "Mastodon",
    handoffActive: true,
    upgradeTier: "free-credentials",
    upgradeCost: "Free — paste an access token",
    upgradeTime: "~30 minutes",
    upgradeNotes:
      "Mastodon is per-instance. You'd paste your home instance URL plus a personal access token.",
    accent: "peach",
  },
];

export const TIER_LABEL: Record<ConnectionTier, string> = {
  "free-credentials": "Free · paste credentials",
  "free-review": "Free · review required",
  "paid-api": "Paid API",
  "no-public-api": "No public API",
};
