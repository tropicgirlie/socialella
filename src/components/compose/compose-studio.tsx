"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { PLATFORMS, type PlatformId } from "@/lib/constants";
import type { TonePreset } from "@/lib/constants";
import { analyzeConfidence } from "@/lib/confidence";
import { checklistLabels, defaultChecklist } from "@/lib/founder-checklist";
import { VoiceLensCard } from "@/components/compose/voice-lens-card";
import { defaultToneForPlatform, applyTonePreset } from "@/lib/tone";
import {
  savePost,
  schedulePost,
  suggestSlotForEnergy,
} from "@/actions/posts";
import { aiRewriteVariant } from "@/actions/ai";
import type { apps, campaigns, postMedia, posts, postVariants } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon, type IconName } from "@/components/Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AppRow = typeof apps.$inferSelect;
type CampaignRow = typeof campaigns.$inferSelect;
type PostRow = typeof posts.$inferSelect;
type VariantRow = typeof postVariants.$inferSelect;
type MediaRow = typeof postMedia.$inferSelect;

type VariantState = Record<
  PlatformId,
  { content: string; tone: TonePreset }
>;

const VISIBLE_PLATFORMS: PlatformId[] = [
  "x",
  "linkedin",
  "instagram",
  "threads",
  "tiktok",
];

const PLATFORM_META: Record<
  PlatformId,
  { label: string; icon: IconName; color: string; charCap: number }
> = {
  x: { label: "X (Twitter)", icon: "XLogo", color: "#0f172a", charCap: 280 },
  linkedin: {
    label: "LinkedIn",
    icon: "LinkedinLogo",
    color: "#0a66c2",
    charCap: 3000,
  },
  instagram: {
    label: "Instagram",
    icon: "InstagramLogo",
    color: "#db2777",
    charCap: 2200,
  },
  facebook: {
    label: "Facebook",
    icon: "ShareNetwork",
    color: "#1877f2",
    charCap: 5000,
  },
  threads: {
    label: "Threads",
    icon: "ChatCircle",
    color: "#0f172a",
    charCap: 500,
  },
  tiktok: {
    label: "TikTok",
    icon: "TiktokLogo",
    color: "#0f172a",
    charCap: 2200,
  },
  pinterest: {
    label: "Pinterest",
    icon: "Sparkle",
    color: "#bd081c",
    charCap: 500,
  },
  bluesky: {
    label: "Bluesky",
    icon: "Sparkle",
    color: "#0ea5e9",
    charCap: 300,
  },
  mastodon: {
    label: "Mastodon",
    icon: "Sparkle",
    color: "#8b5cf6",
    charCap: 500,
  },
};

const TONE_PROFILES = [
  { id: "warm-founder", label: "Warm founder", icon: "Heart" as IconName },
  { id: "ship-fast", label: "Ship fast", icon: "Lightning" as IconName },
  { id: "calm-expert", label: "Calm expert", icon: "ShieldCheck" as IconName },
  { id: "celebratory", label: "Celebratory", icon: "Sparkle" as IconName },
];

const DEFAULT_TONE_LEVELS = {
  professional: 30,
  warm: 80,
  playful: 40,
  educational: 60,
  confident: 70,
};

const TONE_DIMENSIONS: { key: keyof typeof DEFAULT_TONE_LEVELS; label: string }[] =
  [
    { key: "professional", label: "Professional" },
    { key: "warm", label: "Warm" },
    { key: "playful", label: "Playful" },
    { key: "educational", label: "Educational" },
    { key: "confident", label: "Confident" },
  ];

const AI_IDEA_PROMPTS: { id: string; label: string; prefix: string }[] = [
  {
    id: "benefit",
    label: "Add a customer benefit",
    prefix: "What changes for the user when they try this:",
  },
  {
    id: "tip",
    label: "Share a mini tip",
    prefix: "One quick win you can use today —",
  },
  {
    id: "howto",
    label: "Turn into a quick how-to",
    prefix: "How I use this in 3 steps:\n1. ",
  },
  {
    id: "question",
    label: "Ask a question to engage",
    prefix: "Curious — ",
  },
];

const STARTER_TEMPLATES: { id: string; label: string; body: string }[] = [
  {
    id: "shipped",
    label: "Just shipped",
    body: "Just shipped: [feature] in [App].\n\n[One sentence on why it matters].\n\nTry it → [link]",
  },
  {
    id: "behind",
    label: "Behind the build",
    body: "Behind the build: [decision or trade-off you made today].\n\nHere's the why: [your reasoning].\n\nWould love your take — would you do it differently?",
  },
  {
    id: "tip",
    label: "Quick tip",
    body: "Tip for [audience] using [tool]:\n\n[one specific actionable thing].\n\nIt saves me about [time/effort] every [interval].",
  },
];

function buildInitialVariants(
  base: string,
  existing?: VariantRow[],
): VariantState {
  const state = {} as VariantState;
  for (const p of PLATFORMS) {
    const tone = defaultToneForPlatform(p);
    const found = existing?.find((v) => v.platform === p);
    state[p] = {
      content: found?.content ?? applyTonePreset(base, p, tone),
      tone: (found?.tone as TonePreset) ?? tone,
    };
  }
  return state;
}

/* ---------------------------------------------------------------- */
/* Studio header                                                     */
/* ---------------------------------------------------------------- */

function SavedIndicator({ at }: { at: Date | null }) {
  // Re-render every 30s so the "Saved X ago" label stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  const label = at
    ? `Saved ${formatDistanceToNow(at, { addSuffix: false })} ago`
    : "Not saved yet";
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs text-[var(--gray-600)]">
      <Icon
        name="Check"
        weight="bold"
        className="h-3 w-3 text-[var(--success-600)]"
      />
      {label}
    </span>
  );
}

function StudioHeader({
  status,
  savedAt,
  onAddToQueue,
  onSaveDraft,
  onSchedule,
  onDuplicate,
  onArchive,
  pending,
  hasSchedule,
}: {
  status: "draft" | "scheduled" | "ready_to_post" | "posted";
  savedAt: Date | null;
  onAddToQueue: () => void;
  onSaveDraft: () => void;
  onSchedule: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  pending: boolean;
  hasSchedule: boolean;
}) {
  const statusLabel: Record<string, string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    ready_to_post: "Ready",
    posted: "Posted",
  };

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-1.5 text-2xl font-bold tracking-tight text-[var(--gray-900)]">
          Compose Studio
          <Icon
            name="Sparkle"
            weight="fill"
            className="h-4 w-4 text-[var(--violet-500)]"
          />
        </h1>
        <p className="mt-1 text-sm text-[var(--gray-600)]">
          One idea, every platform. Tailored tone. Your voice.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SavedIndicator at={savedAt} />
        <span className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-medium text-[var(--gray-700)]">
          {statusLabel[status]}
          <Icon name="CaretDown" className="h-3 w-3 text-[var(--gray-400)]" />
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white text-[var(--gray-600)] hover:bg-[var(--gray-50)]"
            >
              …
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem onSelect={onSaveDraft} disabled={pending}>
              Save as draft
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate} disabled={pending}>
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onArchive} disabled={pending}>
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="inline-flex h-9 overflow-hidden rounded-[var(--radius-md)] shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)]">
          <button
            type="button"
            onClick={onAddToQueue}
            disabled={pending}
            className="inline-flex h-9 items-center gap-1.5 bg-[var(--violet-600)] pl-3 pr-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--violet-700)] disabled:opacity-60"
          >
            <Icon name="Tray" weight="fill" className="h-3.5 w-3.5" />
            {hasSchedule ? "Schedule" : "Add to queue"}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More queue options"
                className="inline-flex h-9 w-7 items-center justify-center bg-[var(--violet-700)] text-white hover:bg-[var(--violet-800)]"
              >
                <Icon name="CaretDown" className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onSchedule} disabled={pending}>
                Schedule for later
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onSaveDraft} disabled={pending}>
                Save as draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- */
/* Idea card + toolbar                                               */
/* ---------------------------------------------------------------- */

function IdeaCard({
  base,
  onChange,
  onAiRewrite,
  onUseTemplate,
  pending,
}: {
  base: string;
  onChange: (s: string) => void;
  onAiRewrite: () => void;
  onUseTemplate: () => void;
  pending: boolean;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-[var(--gray-150)] px-5 py-4">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-900)]">
            <Icon
              name="Lightning"
              weight="fill"
              className="h-3.5 w-3.5 text-[var(--violet-600)]"
            />
            Your idea
          </h2>
          <p className="mt-0.5 text-xs text-[var(--gray-500)]">
            Capture your raw thought. We&apos;ll shape it for each platform.
          </p>
        </div>
        <button
          type="button"
          onClick={onAiRewrite}
          disabled={pending || !base.trim()}
          className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--violet-200)] bg-[var(--violet-50)] px-2.5 text-[11px] font-semibold text-[var(--violet-700)] transition-colors hover:bg-[var(--violet-100)] disabled:opacity-50"
        >
          <Icon name="Sparkle" weight="fill" className="h-3 w-3" />
          AI rewrite
        </button>
      </header>
      <div className="px-5 py-4">
        <Textarea
          value={base}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Just shipped a new feature. What did you change and why does it matter?"
          rows={9}
          className="resize-none border-none bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0"
        />
      </div>
      <footer className="flex flex-wrap items-center gap-1.5 border-t border-[var(--gray-150)] px-3 py-2">
        <ToolbarButton icon="ImageSquare" label="Add media" />
        <ToolbarButton icon="LinkSimple" label="Add link" />
        <ToolbarButton icon="Notepad" label="Add alt text" />
        <ToolbarButton
          icon="ClipboardText"
          label="Use template"
          onClick={onUseTemplate}
        />
        <span className="ml-auto text-[11px] tabular-nums text-[var(--gray-500)]">
          {base.length} / 280
        </span>
      </footer>
    </section>
  );
}

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-[var(--gray-600)] transition-colors hover:bg-[var(--gray-50)] hover:text-[var(--gray-800)]"
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ---------------------------------------------------------------- */
/* Platform tabs                                                     */
/* ---------------------------------------------------------------- */

function PlatformTabs({
  active,
  onChange,
  enabled,
  variants,
}: {
  active: PlatformId;
  onChange: (p: PlatformId) => void;
  enabled: PlatformId[];
  variants: VariantState;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {enabled.map((p) => {
        const meta = PLATFORM_META[p];
        const isActive = p === active;
        const len = variants[p]?.content.length ?? 0;
        const over = len > meta.charCap;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-medium transition-colors",
              isActive
                ? "border-[var(--gray-900)] bg-white text-[var(--gray-900)] shadow-sm"
                : "border-[var(--gray-200)] bg-white text-[var(--gray-600)] hover:border-[var(--gray-300)]",
            )}
          >
            <Icon
              name={meta.icon}
              weight={isActive ? "fill" : "regular"}
              className="h-3.5 w-3.5"
              style={{ color: isActive ? meta.color : undefined }}
            />
            {meta.label}
            {over && (
              <span className="rounded-full bg-[var(--color-danger-soft)] px-1 text-[9px] font-bold text-[var(--color-danger)]">
                !
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--gray-300)] text-[var(--gray-500)] hover:bg-[var(--gray-50)]"
        aria-label="Add platform"
      >
        <Icon name="Plus" weight="bold" className="h-3.5 w-3.5" />
      </button>
      <a
        href="#preview-all"
        className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[var(--violet-600)] hover:underline"
      >
        Preview all
        <Icon name="ArrowRight" weight="bold" className="h-3 w-3" />
      </a>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Variant card                                                      */
/* ---------------------------------------------------------------- */

function VariantCard({
  platform,
  content,
  onChange,
  onAi,
  pending,
}: {
  platform: PlatformId;
  content: string;
  onChange: (s: string) => void;
  onAi: () => void;
  pending: boolean;
}) {
  const meta = PLATFORM_META[platform];
  const over = content.length > meta.charCap;
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--gray-150)] px-3 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-[var(--gray-700)]">
          <Icon
            name={meta.icon}
            weight="fill"
            className="h-3.5 w-3.5 shrink-0"
            style={{ color: meta.color }}
          />
          <span className="truncate">{meta.label}</span>
        </span>
        <span
          className={cn(
            "text-[10px] tabular-nums",
            over ? "font-semibold text-[var(--color-danger)]" : "text-[var(--gray-500)]",
          )}
        >
          {content.length} / {meta.charCap}
        </span>
      </header>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        rows={9}
        placeholder={`Tailored ${meta.label} variant…`}
        className="flex-1 resize-none border-none bg-transparent p-3 text-xs leading-relaxed shadow-none focus-visible:ring-0"
      />
      <footer className="flex items-center gap-1 border-t border-[var(--gray-150)] px-2 py-1.5 text-[var(--gray-400)]">
        <button
          type="button"
          aria-label="Add image"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--gray-50)] hover:text-[var(--gray-600)]"
        >
          <Icon name="ImageSquare" className="h-3 w-3" />
        </button>
        <button
          type="button"
          aria-label="Attach"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--gray-50)] hover:text-[var(--gray-600)]"
        >
          <Icon name="LinkSimple" className="h-3 w-3" />
        </button>
        <button
          type="button"
          aria-label="Mention"
          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--gray-50)] hover:text-[var(--gray-600)]"
        >
          <Icon name="ChatCircle" className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onAi}
          disabled={pending}
          className="ml-auto inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10px] font-semibold text-[var(--violet-600)] hover:bg-[var(--violet-50)] disabled:opacity-50"
        >
          <Icon name="Sparkle" weight="fill" className="h-2.5 w-2.5" />
          Rewrite
        </button>
      </footer>
    </article>
  );
}

/**
 * Sibling tile to VariantCard — keeps grid rhythm but reads as secondary.
 * Whole tile is the affordance; opens the connections page where platforms
 * are added, removed, or upgraded to direct publish.
 */
function AddRemovePlatformsCard() {
  return (
    <Link
      href="/connections"
      aria-label="Manage platforms in Connections"
      className={cn(
        "group flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-lg)]",
        "border border-dashed border-[var(--gray-200)] bg-white/40",
        "transition-colors hover:border-[var(--violet-300)] hover:bg-[var(--violet-50)]/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet-400)]",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-dashed border-[var(--gray-200)] px-3 py-2.5">
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs font-medium text-[var(--gray-500)] group-hover:text-[var(--violet-700)]">
          <Icon name="Plus" className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Add platform</span>
        </span>
        <span className="text-[10px] tabular-nums text-[var(--gray-400)]">
          {/* Match VariantCard's right-aligned meta slot */}
        </span>
      </header>

      <div className="flex flex-1 flex-col items-start justify-between gap-3 px-3 py-3">
        <p className="text-[11px] leading-relaxed text-[var(--gray-600)] group-hover:text-[var(--gray-700)]">
          Connect another network or upgrade one to one-click publish.
        </p>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--violet-600)] group-hover:text-[var(--violet-700)]">
          Manage in Connections
          <Icon
            name="ArrowRight"
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

/* ---------------------------------------------------------------- */
/* Tone & voice                                                      */
/* ---------------------------------------------------------------- */

function ToneSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-[var(--gray-700)]">{label}</span>
        <span className="tabular-nums text-[var(--gray-500)]">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--gray-200)] accent-[var(--violet-600)]"
        style={{
          background: `linear-gradient(to right, var(--violet-500) 0%, var(--violet-500) ${value}%, var(--gray-200) ${value}%, var(--gray-200) 100%)`,
        }}
      />
    </div>
  );
}

function ToneVoiceCard({
  profileId,
  onProfileChange,
  levels,
  onLevelChange,
}: {
  profileId: string;
  onProfileChange: (id: string) => void;
  levels: typeof DEFAULT_TONE_LEVELS;
  onLevelChange: (key: keyof typeof DEFAULT_TONE_LEVELS, n: number) => void;
}) {
  const profile = TONE_PROFILES.find((p) => p.id === profileId) ?? TONE_PROFILES[0];
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-900)]">
          Tone &amp; voice
          <span
            aria-hidden
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--gray-100)] text-[9px] text-[var(--gray-500)]"
          >
            i
          </span>
        </h2>
      </header>
      <div className="space-y-4 px-4 py-4">
        <div>
          <p className="text-[11px] font-medium text-[var(--gray-500)]">
            Tone profile
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mt-1.5 flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-sm hover:bg-[var(--gray-50)]"
              >
                <span className="flex items-center gap-1.5">
                  <Icon
                    name={profile.icon}
                    weight="fill"
                    className="h-3.5 w-3.5 text-[var(--pink-500)]"
                  />
                  {profile.label}
                </span>
                <Icon
                  name="CaretDown"
                  className="h-3 w-3 text-[var(--gray-400)]"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-full">
              {TONE_PROFILES.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onSelect={() => onProfileChange(p.id)}
                  className="gap-2"
                >
                  <Icon
                    name={p.icon}
                    weight="fill"
                    className="h-3.5 w-3.5 text-[var(--pink-500)]"
                  />
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {TONE_DIMENSIONS.map((d) => (
            <ToneSlider
              key={d.key}
              label={d.label}
              value={levels[d.key]}
              onChange={(n) => onLevelChange(d.key, n)}
            />
          ))}
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-between border-t border-[var(--gray-150)] pt-3 text-[11px] font-medium text-[var(--gray-600)] hover:text-[var(--gray-900)]"
        >
          More settings
          <Icon name="CaretDown" className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Founder checklist                                                 */
/* ---------------------------------------------------------------- */

function FounderChecklistCard({
  checklist,
  labels,
  onToggle,
}: {
  checklist: Record<string, boolean>;
  labels: Record<string, string>;
  onToggle: (key: string, v: boolean) => void;
}) {
  const entries = Object.entries(labels);
  const checkedCount = entries.filter(([k]) => checklist[k]).length;
  const total = entries.length;
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--gray-900)]">
          Founder checklist
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            checkedCount === total
              ? "bg-emerald-50 text-emerald-700"
              : "bg-[var(--gray-100)] text-[var(--gray-600)]",
          )}
        >
          {checkedCount}/{total}
        </span>
      </header>
      <ul className="divide-y divide-[var(--gray-150)]">
        {entries.map(([key, label]) => {
          const checked = Boolean(checklist[key]);
          return (
            <li key={key}>
              <label className="flex cursor-pointer items-center gap-2 px-4 py-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onToggle(key, !checked)}
                  className={cn(
                    "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                    checked
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-[var(--gray-300)] bg-white text-transparent hover:border-[var(--gray-400)]",
                  )}
                >
                  <Icon name="Check" weight="bold" className="h-2.5 w-2.5" />
                </button>
                <span
                  className={cn(
                    "flex-1 text-xs",
                    checked
                      ? "text-[var(--gray-700)]"
                      : "text-[var(--gray-600)]",
                  )}
                >
                  {label}
                </span>
                <Icon
                  name="CheckCircle"
                  className="h-3 w-3 text-[var(--gray-300)]"
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Confidence pass                                                   */
/* ---------------------------------------------------------------- */

function ConfidencePassCard({
  base,
  onScan,
  pending,
}: {
  base: string;
  onScan: () => void;
  pending: boolean;
}) {
  const issues = useMemo(() => analyzeConfidence(base), [base]);
  const looksGood = issues.length === 0 && base.trim().length > 0;
  const checks = [
    {
      label: "Tone is friendly & confident",
      ok: !issues.some((i) => i.severity === "softener" || i.severity === "hedge"),
    },
    {
      label: "No risky or negative phrasing",
      ok: !/\b(hate|sucks|terrible|stupid)\b/i.test(base),
    },
    {
      label: "Clear value and audience",
      ok: base.length > 60,
    },
    {
      label: "Good length for the platform",
      ok: base.length > 0 && base.length <= 280,
    },
  ];
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-900)]">
          <Icon
            name="ShieldCheck"
            weight="fill"
            className="h-3.5 w-3.5 text-[var(--violet-600)]"
          />
          Confidence pass
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            looksGood
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700",
          )}
        >
          {looksGood ? "Looks good!" : `${issues.length} flag${issues.length === 1 ? "" : "s"}`}
        </span>
      </header>
      <div className="px-4 py-3">
        <p className="text-[11px] text-[var(--gray-600)]">
          We scanned your post for tone, clarity, and red flags.
        </p>
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li
              key={c.label}
              className="flex items-center gap-2 text-[11px] text-[var(--gray-700)]"
            >
              <Icon
                name="CheckCircle"
                weight="fill"
                className={cn(
                  "h-3.5 w-3.5",
                  c.ok ? "text-emerald-500" : "text-[var(--gray-300)]",
                )}
              />
              {c.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onScan}
          disabled={pending}
          className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white text-[11px] font-semibold text-[var(--gray-700)] hover:bg-[var(--gray-50)] disabled:opacity-50"
        >
          <Icon name="ArrowsClockwise" className="h-3 w-3" />
          Run again
        </button>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* AI ideas                                                          */
/* ---------------------------------------------------------------- */

function AIIdeasCard({
  onApply,
}: {
  onApply: (prefix: string) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--pink-200)] bg-[var(--pink-50)]/60 p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-900)]">
        <Icon
          name="Sparkle"
          weight="fill"
          className="h-3.5 w-3.5 text-[var(--violet-600)]"
        />
        AI ideas for this post
      </h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {AI_IDEA_PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onApply(p.prefix)}
            className="inline-flex items-center rounded-full border border-[var(--violet-200)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--violet-700)] transition-colors hover:bg-[var(--violet-50)]"
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--violet-200)] bg-white text-[11px] font-semibold text-[var(--violet-700)] hover:bg-[var(--violet-50)]"
      >
        <Icon name="Sparkle" weight="fill" className="h-3 w-3" />
        See more ideas
      </button>
    </section>
  );
}

function GotThisCard() {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--pink-200)] bg-[var(--pink-50)]/40 p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-900)]">
        <Icon
          name="Heart"
          weight="fill"
          className="h-3.5 w-3.5 text-[var(--pink-500)]"
        />
        You&apos;ve got this
      </h2>
      <div className="mt-2 flex items-end gap-3">
        <p className="flex-1 text-[11px] leading-snug text-[var(--gray-700)]">
          Batching like this is future you{" "}
          <span className="text-[var(--violet-600)]">says thank you.</span>
        </p>
        <svg
          viewBox="0 0 90 70"
          aria-hidden
          className="h-16 w-20 shrink-0"
        >
          <g
            fill="none"
            stroke="var(--gray-700)"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M28 18 C 25 14, 38 8, 44 12 C 50 8, 60 14, 56 22 C 60 26, 56 32, 50 32 L 32 32 C 28 30, 26 24, 28 18 Z"
              fill="var(--violet-100)"
            />
            <path d="M34 30 C 32 38, 38 44, 46 44 C 54 44, 56 38, 54 30" />
            <circle cx="40" cy="34" r="1" fill="var(--gray-700)" />
            <circle cx="50" cy="34" r="1" fill="var(--gray-700)" />
            <path d="M42 38 C 44 40, 48 40, 50 38" />
            <path
              d="M22 60 C 24 50, 32 44, 46 44 C 60 44, 68 50, 70 60"
              fill="white"
            />
            <rect
              x="32"
              y="56"
              width="32"
              height="14"
              rx="2"
              fill="var(--gray-100)"
            />
            <rect x="35" y="59" width="26" height="9" rx="1" fill="white" />
            <rect
              x="64"
              y="46"
              width="10"
              height="8"
              rx="1.5"
              fill="var(--pink-200)"
            />
            <path d="M74 47 C 78 47, 78 53, 74 53" />
          </g>
        </svg>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Bottom config row                                                 */
/* ---------------------------------------------------------------- */

const RESURFACE_OPTIONS = [
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 45, label: "45 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
];

function BottomConfigCard({
  icon,
  iconColor,
  label,
  children,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--gray-700)]">
        <Icon
          name={icon}
          weight="fill"
          className="h-3.5 w-3.5"
          style={{ color: iconColor }}
        />
        {label}
      </p>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* Use template dialog (lightweight inline)                          */
/* ---------------------------------------------------------------- */

function TemplatePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (body: string) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--gray-200)] bg-white p-5 shadow-[var(--shadow-md)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--gray-900)]">
          Pick a starter template
        </h3>
        <p className="mt-1 text-xs text-[var(--gray-500)]">
          We&apos;ll pre-fill your idea — edit freely after.
        </p>
        <ul className="mt-4 space-y-2">
          {STARTER_TEMPLATES.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(t.body);
                  onClose();
                }}
                className="flex w-full flex-col rounded-[var(--radius-md)] border border-[var(--gray-200)] p-3 text-left transition-colors hover:border-[var(--violet-300)] hover:bg-[var(--violet-50)]"
              >
                <span className="text-sm font-semibold text-[var(--gray-900)]">
                  {t.label}
                </span>
                <span className="mt-1 line-clamp-2 text-[11px] text-[var(--gray-500)]">
                  {t.body}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Main component                                                    */
/* ---------------------------------------------------------------- */

export function ComposeStudio(props: {
  apps: AppRow[];
  campaignsByApp: Record<string, CampaignRow[]>;
  initial?: {
    post: PostRow;
    variants: VariantRow[];
    media: MediaRow[];
  } | null;
}) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(
    props.initial?.post.id ?? null,
  );
  const [appId, setAppId] = useState(
    props.initial?.post.appId ?? props.apps[0]?.id ?? "",
  );
  const [campaignId, setCampaignId] = useState<string | null>(
    props.initial?.post.campaignId ?? null,
  );
  const [baseContent, setBaseContent] = useState(
    props.initial?.post.baseContent ?? "",
  );
  const [evergreen, setEvergreen] = useState(
    props.initial?.post.isEvergreen ?? false,
  );
  const [resurfaceDays, setResurfaceDays] = useState<number>(45);
  const [scheduleAt, setScheduleAt] = useState("");
  const [energyTag, setEnergyTag] = useState<"" | "high" | "low">(
    (props.initial?.post.energyTag as "high" | "low" | "") ?? "",
  );
  const [suggestion, setSuggestion] = useState<{
    iso: string;
    hint: string;
  } | null>(null);
  const [variants, setVariants] = useState<VariantState>(() =>
    buildInitialVariants(
      props.initial?.post.baseContent ?? "",
      props.initial?.variants,
    ),
  );
  const [activeTab, setActiveTab] = useState<PlatformId>("x");
  const [savedAt, setSavedAt] = useState<Date | null>(
    props.initial?.post.updatedAt
      ? new Date(props.initial.post.updatedAt)
      : null,
  );
  const [toneProfile, setToneProfile] = useState("warm-founder");
  const [toneLevels, setToneLevels] = useState(DEFAULT_TONE_LEVELS);
  const [showTemplates, setShowTemplates] = useState(false);
  const [pending, startTransition] = useTransition();
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => ({
    ...defaultChecklist(false),
    ...(props.initial?.post.founderChecklistJson ?? {}),
  }));
  const labels = useMemo(() => checklistLabels(false), []);

  const status = (props.initial?.post.status ?? "draft") as
    | "draft"
    | "scheduled"
    | "ready_to_post"
    | "posted";
  const campaigns = props.campaignsByApp[appId] ?? [];
  const visiblePlatforms = VISIBLE_PLATFORMS;
  const variantGridPlatforms = visiblePlatforms.slice(0, 3);

  // Fetch a real energy-aware suggestion whenever the energy tag changes
  // (or on mount). Falls back to a sensible default when slots aren't set.
  useEffect(() => {
    let cancelled = false;
    const tag = energyTag === "" ? null : energyTag;
    void suggestSlotForEnergy(tag).then((res) => {
      if (cancelled) return;
      setSuggestion(res);
    });
    return () => {
      cancelled = true;
    };
  }, [energyTag]);

  const suggestedSlotLabel = suggestion
    ? format(new Date(suggestion.iso), "MMM d 'at' h:mm a")
    : "Calculating…";

  /* ---------- helpers ---------- */

  function updateBase(next: string) {
    setBaseContent(next);
    // Refresh variants from base when they were auto-generated (untouched).
    setVariants((prev) => {
      const out = { ...prev };
      for (const p of PLATFORMS) {
        const stale =
          !out[p].content ||
          out[p].content === applyTonePreset(baseContent, p, out[p].tone);
        if (stale) {
          out[p] = { ...out[p], content: applyTonePreset(next, p, out[p].tone) };
        }
      }
      return out;
    });
  }

  async function persistDraft(): Promise<string | null> {
    if (!appId) {
      toast.error("Choose an app to promote.");
      return null;
    }
    const payload = {
      appId,
      campaignId,
      baseContent,
      launchDayMode: false,
      isEvergreen: evergreen,
      energyTag: energyTag === "" ? null : energyTag,
      founderChecklistJson: checklist,
      variants: PLATFORMS.map((p) => ({
        platform: p,
        content: variants[p].content,
        tone: variants[p].tone,
      })),
    };
    const res = await savePost(postId, payload);
    if ("error" in res && res.error) {
      toast.error("Could not save draft.");
      return null;
    }
    const id = res.id ?? postId;
    if (id) setPostId(id);
    setSavedAt(new Date());
    router.refresh();
    return id;
  }

  function handleSave() {
    startTransition(async () => {
      const id = await persistDraft();
      if (id) toast.success("Draft saved.");
    });
  }

  function handleAddToQueue() {
    startTransition(async () => {
      const id = await persistDraft();
      if (!id) return;
      const targetIso = scheduleAt
        ? new Date(scheduleAt).toISOString()
        : suggestion?.iso ?? null;
      if (!targetIso) {
        toast.error("Could not compute a slot. Pick a time below.");
        return;
      }
      const res = await schedulePost(id, targetIso);
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      const when = format(new Date(targetIso), "MMM d 'at' h:mm a");
      toast.success(
        scheduleAt
          ? `Scheduled for ${when}.`
          : `Added to queue — ${when}.`,
      );
      router.push(`/queue?highlight=${id}`);
    });
  }

  function handleSchedule() {
    if (!scheduleAt) {
      toast.error("Pick a date and time below first.");
      return;
    }
    handleAddToQueue();
  }

  function handleArchive() {
    toast.message("Archive lives in the Library — open it there.");
  }

  function handleDuplicate() {
    setPostId(null);
    setSavedAt(null);
    toast.success("Started a duplicate. Save to keep it.");
  }

  function handleAiRewriteBase() {
    if (!baseContent.trim()) {
      toast.message("Add some text first.");
      return;
    }
    startTransition(async () => {
      const res = await aiRewriteVariant({
        base: baseContent,
        platform: "x",
        tone: "warm",
      });
      if ("error" in res) {
        toast.error(`AI rewrite failed: ${res.error}`);
        return;
      }
      if ("skipped" in res) {
        toast.message(res.reason);
        return;
      }
      updateBase(res.text);
      toast.success("Idea sharpened.");
    });
  }

  function handleAiVariant(p: PlatformId) {
    startTransition(async () => {
      const res = await aiRewriteVariant({
        base: variants[p].content || baseContent,
        platform: p,
        tone: variants[p].tone,
      });
      if ("error" in res) {
        toast.error(`AI rewrite failed: ${res.error}`);
        return;
      }
      if ("skipped" in res) {
        toast.message(res.reason);
        return;
      }
      setVariants((prev) => ({
        ...prev,
        [p]: { ...prev[p], content: res.text },
      }));
      toast.success(`${PLATFORM_META[p].label} rewrite applied.`);
    });
  }

  function handleApplyIdea(prefix: string) {
    updateBase(baseContent ? `${prefix} ${baseContent}` : prefix);
  }

  function handleScanAgain() {
    toast.success("Re-scanned.");
    router.refresh();
  }

  /* ---------- empty state for no apps ---------- */

  if (props.apps.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--gray-300)] bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-[var(--gray-900)]">
          Add an app first
        </h2>
        <p className="mt-1 text-sm text-[var(--gray-600)]">
          Compose Studio organizes posts around the apps you build.
        </p>
        <Link
          href="/apps"
          className="mt-4 inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--violet-600)] px-3 text-sm font-semibold text-white hover:bg-[var(--violet-700)]"
        >
          Add an app
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StudioHeader
        status={status}
        savedAt={savedAt}
        onAddToQueue={handleAddToQueue}
        onSaveDraft={handleSave}
        onSchedule={handleSchedule}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        pending={pending}
        hasSchedule={Boolean(scheduleAt)}
      />

      {/* Three-column workspace */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_280px]">
        {/* LEFT: Idea + variants */}
        <div className="min-w-0 space-y-4">
          <IdeaCard
            base={baseContent}
            onChange={updateBase}
            onAiRewrite={handleAiRewriteBase}
            onUseTemplate={() => setShowTemplates(true)}
            pending={pending}
          />

          <PlatformTabs
            active={activeTab}
            onChange={setActiveTab}
            enabled={visiblePlatforms}
            variants={variants}
          />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {variantGridPlatforms.map((p) => (
              <VariantCard
                key={p}
                platform={p}
                content={variants[p].content}
                onChange={(s) =>
                  setVariants((prev) => ({
                    ...prev,
                    [p]: { ...prev[p], content: s },
                  }))
                }
                onAi={() => handleAiVariant(p)}
                pending={pending}
              />
            ))}
            <AddRemovePlatformsCard />
          </div>
        </div>

        {/* MIDDLE: Tone & voice */}
        <div className="min-w-0 space-y-4">
          <ToneVoiceCard
            profileId={toneProfile}
            onProfileChange={setToneProfile}
            levels={toneLevels}
            onLevelChange={(k, n) =>
              setToneLevels((prev) => ({ ...prev, [k]: n }))
            }
          />
        </div>

        {/* RIGHT: Checklist + confidence + ideas */}
        <div className="min-w-0 space-y-4">
          <FounderChecklistCard
            checklist={checklist}
            labels={labels}
            onToggle={(key, v) =>
              setChecklist((prev) => ({ ...prev, [key]: v }))
            }
          />
          <ConfidencePassCard
            base={baseContent}
            onScan={handleScanAgain}
            pending={pending}
          />
          <VoiceLensCard
            base={baseContent}
            onApplyRewrite={(next) => updateBase(next)}
          />
          <AIIdeasCard onApply={handleApplyIdea} />
          <GotThisCard />
        </div>
      </div>

      {/* BOTTOM: config row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <BottomConfigCard
          icon="ArrowsClockwise"
          iconColor="var(--success-600)"
          label="Evergreen post"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEvergreen((v) => !v)}
              className={cn(
                "inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                evergreen ? "bg-[var(--violet-600)]" : "bg-[var(--gray-200)]",
              )}
              role="switch"
              aria-checked={evergreen}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  evergreen ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </button>
            <span className="text-[11px] text-[var(--gray-600)]">
              Re-surface after
            </span>
            <select
              value={resurfaceDays}
              onChange={(e) => setResurfaceDays(Number(e.target.value))}
              disabled={!evergreen}
              className="h-7 rounded-md border border-[var(--gray-200)] bg-white px-1.5 text-[11px] disabled:opacity-50"
            >
              {RESURFACE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </BottomConfigCard>

        <BottomConfigCard
          icon="Flag"
          iconColor="var(--violet-600)"
          label="Campaign"
        >
          <div className="flex items-center gap-2">
            <select
              value={campaignId ?? ""}
              onChange={(e) => setCampaignId(e.target.value || null)}
              className="h-8 flex-1 rounded-md border border-[var(--gray-200)] bg-white px-2 text-[11px]"
            >
              <option value="">No campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={appId}
              onChange={(e) => {
                setAppId(e.target.value);
                setCampaignId(null);
              }}
              className="h-8 rounded-md border border-[var(--gray-200)] bg-white px-2 text-[11px]"
              aria-label="App"
            >
              {props.apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </BottomConfigCard>

        <BottomConfigCard
          icon="CalendarBlank"
          iconColor="var(--pink-600)"
          label="Schedule"
        >
          <div className="flex items-center gap-1.5">
            <Input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="h-8 flex-1 text-[11px]"
            />
            <select
              value={energyTag}
              onChange={(e) =>
                setEnergyTag(e.target.value as "" | "high" | "low")
              }
              className="h-8 rounded-md border border-[var(--gray-200)] bg-white px-1.5 text-[10px]"
              aria-label="Energy tag"
            >
              <option value="">Auto</option>
              <option value="high">High</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-[10px] text-[var(--gray-500)]">
              <Icon
                name="Lightning"
                weight="fill"
                className="h-2.5 w-2.5 text-[var(--violet-500)]"
              />
              {scheduleAt
                ? "Custom time set"
                : `${suggestedSlotLabel}${suggestion ? ` · ${suggestion.hint}` : ""}`}
            </p>
            {!scheduleAt && suggestion && (
              <button
                type="button"
                onClick={() =>
                  setScheduleAt(
                    format(
                      new Date(suggestion.iso),
                      "yyyy-MM-dd'T'HH:mm",
                    ),
                  )
                }
                className="shrink-0 text-[10px] font-semibold text-[var(--violet-600)] hover:underline"
              >
                Apply
              </button>
            )}
            {scheduleAt && (
              <button
                type="button"
                onClick={() => setScheduleAt("")}
                className="shrink-0 text-[10px] font-semibold text-[var(--gray-500)] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </BottomConfigCard>
      </div>

      <TemplatePicker
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onPick={(body) => updateBase(body)}
      />
    </div>
  );
}
