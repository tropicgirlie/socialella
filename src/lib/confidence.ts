export type ConfidenceIssue = {
  pattern: string;
  suggestion: string;
  start: number;
  end: number;
  severity: "softener" | "hedge" | "qualifier";
};

const RULES: Array<{
  re: RegExp;
  suggestion: string;
  severity: ConfidenceIssue["severity"];
}> = [
  {
    re: /\bjust\b/gi,
    suggestion: "Remove “just” — your ask stands on its own.",
    severity: "softener",
  },
  {
    re: /\bsorry\b/gi,
    suggestion: "Swap “sorry” for thanks or a direct line unless an apology is truly owed.",
    severity: "softener",
  },
  {
    re: /\bI think\b/gi,
    suggestion: "Lead with the claim: drop “I think” or replace with evidence.",
    severity: "hedge",
  },
  {
    re: /\bmaybe\b/gi,
    suggestion: "Replace “maybe” with a clear yes/no or a timeframe.",
    severity: "hedge",
  },
  {
    re: /\bkind of\b|\bsort of\b/gi,
    suggestion: "Remove the hedge — name what you mean plainly.",
    severity: "hedge",
  },
  {
    re: /\ba bit\b/gi,
    suggestion: "Quantify or describe specifically instead of “a bit”.",
    severity: "qualifier",
  },
  {
    re: /\btry to\b/gi,
    suggestion: "Use “I will …” or state what shipped.",
    severity: "qualifier",
  },
  {
    re: /\bhopefully\b/gi,
    suggestion: "Replace with a commitment or a date.",
    severity: "qualifier",
  },
];

export function analyzeConfidence(text: string): ConfidenceIssue[] {
  const issues: ConfidenceIssue[] = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    const re = new RegExp(rule.re.source, rule.re.flags);
    while ((m = re.exec(text)) !== null) {
      issues.push({
        pattern: m[0],
        suggestion: rule.suggestion,
        start: m.index,
        end: m.index + m[0].length,
        severity: rule.severity,
      });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  issues.sort((a, b) => a.start - b.start);
  return issues;
}

export function stripIssue(text: string, issue: ConfidenceIssue): string {
  return text.slice(0, issue.start) + text.slice(issue.end);
}
