export type FounderChecklistKey =
  | "cta"
  | "link"
  | "pricing"
  | "screenshot"
  | "altText"
  | "tone"
  | "safe"
  | "changelog"
  | "demo"
  | "feedback";

export const BASE_KEYS: FounderChecklistKey[] = [
  "cta",
  "link",
  "pricing",
  "screenshot",
  "altText",
  "tone",
  "safe",
];

export const LAUNCH_KEYS: FounderChecklistKey[] = [
  "changelog",
  "demo",
  "feedback",
];

export function defaultChecklist(launchDay: boolean): Record<string, boolean> {
  const base: Record<string, boolean> = {
    cta: false,
    link: false,
    pricing: false,
    screenshot: false,
    altText: false,
    tone: false,
    safe: false,
  };
  if (launchDay) {
    base.changelog = false;
    base.demo = false;
    base.feedback = false;
  }
  return base;
}

export function checklistLabels(launchDay: boolean): Record<string, string> {
  const labels: Record<string, string> = {
    cta: "Clear CTA or next step",
    link: "Link added",
    pricing: "Pricing (if relevant)",
    screenshot: "Screenshot or visual",
    altText: "Alt text added",
    tone: "On-brand tone",
    safe: "Feels aligned & safe",
  };
  if (launchDay) {
    labels.changelog = "Changelog or release notes linked";
    labels.demo = "Demo GIF or screen recording linked";
    labels.feedback = "Explicit ask for feedback or beta testers";
  }
  return labels;
}
