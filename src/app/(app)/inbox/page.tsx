import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = {
  title: "Inbox · Socialella",
};

export default function InboxPage() {
  return (
    <ComingSoon
      icon="ChatCircle"
      eyebrow="Inbox"
      title="Replies, mentions, and DMs"
      description="A single thread of conversations across every connected app — once at least one platform has an API connection."
      bullets={[
        "Mentions and replies in one stream",
        "Quick reply with platform-aware tone",
        "Snooze conversations to a specific day",
        "Quiet hours and energy-aware nudges",
      ]}
      primaryCta="See connection options"
    />
  );
}
