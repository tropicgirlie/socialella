export const PLATFORMS = [
  "x",
  "linkedin",
  "instagram",
  "facebook",
  "threads",
  "tiktok",
  "pinterest",
  "bluesky",
  "mastodon",
] as const;

export type PlatformId = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  x: "X / Twitter",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
};

export const POST_STATUSES = [
  "draft",
  "scheduled",
  "ready_to_post",
  "posted",
  "archived",
] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const ENERGY_TAGS = ["high", "low"] as const;
export type EnergyTag = (typeof ENERGY_TAGS)[number];

export const TONE_PRESETS = ["raw", "pro", "punchy", "warm"] as const;
export type TonePreset = (typeof TONE_PRESETS)[number];

export const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
