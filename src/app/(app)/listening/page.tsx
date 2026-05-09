import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = {
  title: "Listening · Socialella",
};

export default function ListeningPage() {
  return (
    <ComingSoon
      icon="Waveform"
      eyebrow="Listening"
      title="Brand and keyword monitoring"
      description="Catch mentions, questions, and conversations about your apps, even when no one tags you. Needs a paid search or stream API."
      bullets={[
        "Track brand, product, and competitor terms",
        "Filter for buying intent or support requests",
        "Daily digest instead of constant pings",
        "Save mentions worth replying to as drafts",
      ]}
      primaryCta="See connection options"
    />
  );
}
