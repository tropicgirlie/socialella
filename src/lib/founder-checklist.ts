export type FounderChecklistKey =
  | "cta"
  | "link"
  | "altText"
  | "changelog"
  | "demo"
  | "feedback";

export const BASE_KEYS: FounderChecklistKey[] = [
  "cta",
  "link",
  "altText",
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
    altText: false,
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
    cta: "Clear call to action (what should readers do next?)",
    link: "Link to your app or landing page",
    altText: "Alt text planned for every image",
  };
  if (launchDay) {
    labels.changelog = "Changelog or release notes linked";
    labels.demo = "Demo GIF or screen recording linked";
    labels.feedback = "Explicit ask for feedback or beta testers";
  }
  return labels;
}
