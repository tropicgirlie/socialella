/**
 * Voice Lens — surfaces self-promotion language patterns that disproportionately
 * undercut women founders. Runs locally (regex) so it can update as the user types.
 *
 * Categories drawn from research on the self-promotion penalty
 * (Rudman & Glick; Brescoll), hedge language (Lakoff), and the imposter framing
 * literature. Rules are intentionally conservative — we'd rather miss a few than
 * lecture someone over a turn of phrase that's actually fine in context.
 */

export type VoiceLensCategory =
  | "hedging"
  | "apology"
  | "diminisher"
  | "imposter"
  | "permission";

export type VoiceLensFinding = {
  category: VoiceLensCategory;
  /** The literal text we matched (preserves casing). */
  match: string;
  /** Character index in the source string. */
  index: number;
  /** Why this matters in 1 sentence — designed to *inform*, not lecture. */
  why: string;
  /** Concrete reframe suggestion — actionable, not preachy. */
  reframe: string;
};

type Rule = {
  category: VoiceLensCategory;
  pattern: RegExp;
  why: string;
  reframe: (match: string) => string;
};

const RULES: Rule[] = [
  // Hedging — undermines authority
  {
    category: "hedging",
    pattern: /\b(just)\b/gi,
    why: 'Studies show "just" lowers perceived expertise — and the cost is higher for women.',
    reframe: () => 'Drop "just". e.g. "Just shipped" → "Shipped".',
  },
  {
    category: "hedging",
    pattern: /\b(kind of|sort of|a little|a bit)\b/gi,
    why: "Hedges signal uncertainty and pull readers' attention off the substance.",
    reframe: (m) => `Try removing "${m}" and stating it directly.`,
  },
  {
    category: "hedging",
    pattern: /\b(I think|I believe|maybe|perhaps)\b/gi,
    why: "Belief-language reframes a finding as an opinion.",
    reframe: (m) => `Replace "${m}" with the finding itself.`,
  },

  // Apology — shrinks the moment
  {
    category: "apology",
    pattern: /\b(sorry|apologies|apologize|my apologies)\b/gi,
    why: "Apologizing for sharing your work shrinks the moment for the reader, too.",
    reframe: () => "Skip the apology — the work speaks for itself.",
  },

  // Diminishers — shrink your work
  {
    category: "diminisher",
    pattern:
      /\b(little|tiny|small|quick|simple)\s+(project|thing|tool|app|update|tweak|side|feature|hack)\b/gi,
    why: "Diminishers shrink how others perceive your work's scope.",
    reframe: (m) => {
      const noun = m.split(/\s+/).slice(1).join(" ");
      return `Drop the modifier — "${m}" → "${noun}".`;
    },
  },

  // Imposter framing — primes the audience to dismiss
  {
    category: "imposter",
    pattern:
      /\b(I'?m no expert|not an expert|don'?t know if anyone( will)? cares?|nobody asked|probably (old|been done)|sorry if this is obvious|this might be obvious|might be old news)\b/gi,
    why: "Imposter framing primes readers to dismiss what comes next.",
    reframe: () => "Open with what you learned — not your status.",
  },

  // Permission-seeking — signals lower status
  {
    category: "permission",
    pattern:
      /\b(if that'?s ok(ay)?|mind if I|hope (it'?s|its) ok(ay)?|can I share)\b/gi,
    why: "Asking permission to share signals lower status before you've said anything.",
    reframe: () => "Skip the ask — share confidently.",
  },
];

export function analyzeVoice(text: string): VoiceLensFinding[] {
  const findings: VoiceLensFinding[] = [];
  if (!text || !text.trim()) return findings;

  const seen = new Set<string>();
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      const key = `${rule.category}:${m.index}:${m[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        category: rule.category,
        match: m[0],
        index: m.index,
        why: rule.why,
        reframe: rule.reframe(m[0]),
      });
      if (m.index === rule.pattern.lastIndex) rule.pattern.lastIndex++;
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

export const CATEGORY_LABEL: Record<VoiceLensCategory, string> = {
  hedging: "Hedging",
  apology: "Apology",
  diminisher: "Diminisher",
  imposter: "Imposter signal",
  permission: "Permission-seeking",
};
