"use client";

import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import {
  CATEGORY_LABEL,
  analyzeVoice,
  type VoiceLensCategory,
} from "@/lib/voice-lens";
import { aiRewriteForVoice } from "@/actions/ai";
import { Icon } from "@/components/Icon";

const CATEGORY_TINT: Record<
  VoiceLensCategory,
  { bg: string; fg: string }
> = {
  hedging: { bg: "var(--violet-100)", fg: "var(--violet-700)" },
  apology: { bg: "var(--pink-100)", fg: "var(--pink-700)" },
  diminisher: { bg: "#fef3c7", fg: "#92400e" },
  imposter: { bg: "#e0f2fe", fg: "#0369a1" },
  permission: { bg: "#dcfce7", fg: "#166534" },
};

type Props = {
  base: string;
  onApplyRewrite?: (next: string) => void;
};

export function VoiceLensCard({ base, onApplyRewrite }: Props) {
  const findings = useMemo(() => analyzeVoice(base), [base]);
  const [pending, startTransition] = useTransition();

  function handleRewrite() {
    if (!base.trim()) {
      toast.message("Write something first.");
      return;
    }
    startTransition(async () => {
      const res = await aiRewriteForVoice({ base });
      if ("error" in res) {
        toast.error(`Rewrite failed: ${res.error}`);
        return;
      }
      if ("skipped" in res) {
        toast.message(res.reason);
        return;
      }
      onApplyRewrite?.(res.text);
      toast.success("Voice rewrite applied — own it.");
    });
  }

  const isEmpty = base.trim().length === 0;
  const looksStrong = !isEmpty && findings.length === 0;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-start justify-between gap-2 border-b border-[var(--gray-150)] px-4 py-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-900)]">
            <Icon
              name="Eye"
              weight="fill"
              className="h-3.5 w-3.5 text-[var(--violet-600)]"
            />
            Voice Lens
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--gray-500)]">
            Self-promotion bias check
          </p>
        </div>
        {!isEmpty && !looksStrong && (
          <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[var(--violet-100)] px-2 text-[10px] font-bold text-[var(--violet-700)]">
            {findings.length} {findings.length === 1 ? "thing" : "things"}
          </span>
        )}
        {looksStrong && (
          <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700">
            <Icon
              name="CheckCircle"
              weight="fill"
              className="h-2.5 w-2.5"
            />
            Strong
          </span>
        )}
      </header>

      <div className="p-4">
        {isEmpty && (
          <p className="text-[11px] leading-relaxed text-[var(--gray-600)]">
            Voice Lens flags hedging, apologies, diminishers, and imposter
            framing — patterns that disproportionately undercut women
            self-promoting. Start typing to see it work.
          </p>
        )}

        {looksStrong && (
          <p className="text-[11px] leading-relaxed text-[var(--gray-700)]">
            <span className="font-semibold text-[var(--gray-900)]">
              Your voice is strong.
            </span>{" "}
            No softeners, apologies, or imposter framing. Own it.
          </p>
        )}

        {!isEmpty && !looksStrong && (
          <ul className="space-y-2.5">
            {findings.slice(0, 4).map((f, i) => {
              const tint = CATEGORY_TINT[f.category];
              return (
                <li
                  key={`${f.category}-${i}`}
                  className="rounded-[var(--radius-md)] bg-[var(--gray-50)]/70 p-2.5"
                >
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: tint.bg, color: tint.fg }}
                    >
                      {CATEGORY_LABEL[f.category]}
                    </span>
                    <span className="min-w-0 truncate text-[10px] text-[var(--gray-500)]">
                      &ldquo;{f.match}&rdquo;
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--gray-700)]">
                    {f.why}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--gray-900)]">
                    <span className="font-semibold">Try:</span> {f.reframe}
                  </p>
                </li>
              );
            })}
            {findings.length > 4 && (
              <li className="text-center text-[10px] text-[var(--gray-500)]">
                +{findings.length - 4} more
              </li>
            )}
          </ul>
        )}
      </div>

      {!isEmpty && !looksStrong && onApplyRewrite && (
        <footer className="border-t border-[var(--gray-150)] p-3">
          <button
            type="button"
            onClick={handleRewrite}
            disabled={pending}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-600)] text-[11px] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)] transition-colors hover:bg-[var(--violet-700)] disabled:opacity-60"
          >
            <Icon name="Sparkle" weight="fill" className="h-3.5 w-3.5" />
            {pending ? "Rewriting…" : "Rewrite without bias"}
          </button>
        </footer>
      )}
    </section>
  );
}
