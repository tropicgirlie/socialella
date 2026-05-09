"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import type { posts, postVariants } from "@/db/schema";
import { markPosted } from "@/actions/posts";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  type PlatformId,
} from "@/lib/constants";
import {
  getHandoff,
  handoffIsOneClick,
  platformRequiresMedia,
} from "@/lib/platform-links";
import { prepareHandoff } from "@/actions/handoff";
import { checklistLabels } from "@/lib/founder-checklist";
import { Icon, type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

type PostRow = typeof posts.$inferSelect;
type VariantRow = typeof postVariants.$inferSelect;

type WalkthroughPost = {
  post: PostRow;
  variants: VariantRow[];
  appName: string;
  appColor: string;
  appUrl: string | null;
  media: { url: string; alt: string }[];
};

type Props = {
  items: WalkthroughPost[];
};

const VISIBLE_PLATFORMS: PlatformId[] = [
  "x",
  "linkedin",
  "instagram",
  "threads",
  "tiktok",
  "bluesky",
];

const PLATFORM_META: Record<
  PlatformId,
  { icon: IconName; color: string }
> = {
  x: { icon: "XLogo", color: "#0f172a" },
  linkedin: { icon: "LinkedinLogo", color: "#0a66c2" },
  instagram: { icon: "InstagramLogo", color: "#db2777" },
  facebook: { icon: "ShareNetwork", color: "#1877f2" },
  threads: { icon: "ChatCircle", color: "#0f172a" },
  tiktok: { icon: "TiktokLogo", color: "#0f172a" },
  pinterest: { icon: "Sparkle", color: "#bd081c" },
  bluesky: { icon: "Sparkle", color: "#0085ff" },
  mastodon: { icon: "Sparkle", color: "#8b5cf6" },
};

async function downloadMedia(url: string, fallbackName: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fallbackName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function HandoffWalkthrough({ items }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [pendingMark, startMarkTransition] = useTransition();
  const [busyPlatform, setBusyPlatform] = useState<PlatformId | null>(null);
  const [handedOff, setHandedOff] = useState<Record<string, Set<PlatformId>>>(
    {},
  );

  // Clamp the index to the available items: if a post was marked posted at
  // the end of the list and the parent re-fetched, items can shrink under us.
  const safeIndex = items.length > 0 ? Math.min(index, items.length - 1) : 0;
  const item = items[safeIndex] ?? null;

  const checklistEntries = useMemo(() => {
    if (!item) return [];
    const labels = checklistLabels(item.post.launchDayMode);
    const checks = (item.post.founderChecklistJson ?? {}) as Record<
      string,
      boolean
    >;
    return Object.entries(labels).map(([key, label]) => ({
      key,
      label,
      checked: Boolean(checks[key]),
    }));
  }, [item]);

  const variantByPlatform = useMemo(() => {
    if (!item) return new Map<PlatformId, VariantRow>();
    const m = new Map<PlatformId, VariantRow>();
    for (const v of item.variants) {
      m.set(v.platform as PlatformId, v);
    }
    return m;
  }, [item]);

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--gray-300)] bg-white p-12 text-center">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Icon name="CheckCircle" weight="fill" className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[var(--gray-900)]">
          You&apos;re caught up
        </h2>
        <p className="mt-1 text-sm text-[var(--gray-600)]">
          Nothing in the ready queue. Schedule a few posts to keep momentum.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/compose"
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--violet-600)] px-3 text-sm font-semibold text-white hover:bg-[var(--violet-700)]"
          >
            Compose a post
          </Link>
          <Link
            href="/queue"
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-sm font-semibold text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
          >
            Back to queue
          </Link>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const handed = handedOff[item.post.id] ?? new Set<PlatformId>();
  const totalChecks = checklistEntries.length;
  const checkedCount = checklistEntries.filter((c) => c.checked).length;

  async function handlePlatform(platform: PlatformId) {
    if (!item) return;
    setBusyPlatform(platform);
    try {
      const res = await prepareHandoff(item.post.id, platform);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const { content, appUrl, media } = res.data;
      if (!content) {
        toast.error("This post has no content yet.");
        return;
      }

      try {
        await navigator.clipboard.writeText(content);
      } catch {
        // best-effort
      }

      if (platformRequiresMedia(platform)) {
        if (media.length === 0) {
          toast.warning(
            `${PLATFORM_LABELS[platform]} needs media. Caption is on your clipboard.`,
          );
        } else {
          for (const [i, m] of media.entries()) {
            await downloadMedia(m.url, `socialella-${i + 1}.png`);
          }
        }
      }

      const method = getHandoff(platform, content, appUrl ?? undefined);
      let openedUrl: string | null = null;
      if (
        method.kind === "intent" ||
        method.kind === "share" ||
        method.kind === "compose-paste"
      ) {
        openedUrl = method.url;
      } else if (method.kind === "manual" && method.desktopUrl) {
        openedUrl = method.desktopUrl;
      }
      if (openedUrl) {
        window.open(openedUrl, "_blank", "noopener,noreferrer");
      }

      setHandedOff((prev) => {
        const next = { ...prev };
        const set = new Set(next[item.post.id] ?? []);
        set.add(platform);
        next[item.post.id] = set;
        return next;
      });

      toast.success(
        handoffIsOneClick(platform)
          ? `${PLATFORM_LABELS[platform]} opened — review and post.`
          : `Caption copied. ${PLATFORM_LABELS[platform]} opened — paste with ⌘V.`,
      );
    } finally {
      setBusyPlatform(null);
    }
  }

  function handleMarkPosted() {
    if (!item) return;
    startMarkTransition(async () => {
      await markPosted(item.post.id);
      toast.success("Marked as posted. Onto the next.");
      if (safeIndex < items.length - 1) {
        setIndex(safeIndex + 1);
      } else {
        router.refresh();
      }
    });
  }

  function handleSkip() {
    if (safeIndex < items.length - 1) {
      setIndex(safeIndex + 1);
    } else {
      toast.message("You've reached the end of the ready queue.");
    }
  }

  function handlePrev() {
    if (safeIndex > 0) setIndex(safeIndex - 1);
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-xs font-medium text-[var(--gray-600)]">
            Post {safeIndex + 1} of {items.length}
          </span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--gray-100)]">
            <div
              className="h-full rounded-full bg-[var(--violet-500)] transition-all"
              style={{ width: `${((safeIndex + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>
        <Link
          href="/queue"
          className="inline-flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-2.5 text-[11px] font-medium text-[var(--gray-600)] hover:bg-[var(--gray-50)]"
        >
          Exit
        </Link>
      </div>

      <article className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main post column */}
        <div className="min-w-0 space-y-4">
          <header className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: item.appColor }}
              />
              <p className="min-w-0 truncate text-sm font-semibold text-[var(--gray-900)]">
                {item.appName}
              </p>
              {item.post.energyTag && (
                <span className="rounded-full bg-[var(--violet-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--violet-700)]">
                  {item.post.energyTag === "high" ? "High energy" : "Low energy"}
                </span>
              )}
              {item.post.scheduledFor && (
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--gray-500)]">
                  <Icon name="ClockClockwise" className="h-3 w-3" />
                  {format(
                    new Date(item.post.scheduledFor),
                    "MMM d 'at' h:mm a",
                  )}
                </span>
              )}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--gray-800)]">
              {item.post.baseContent || (
                <span className="italic text-[var(--gray-400)]">
                  (empty — open Edit to add content)
                </span>
              )}
            </p>
          </header>

          {/* Per-platform variants */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
            <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                Hand off to a platform
              </h3>
              <span className="text-[11px] text-[var(--gray-500)]">
                {handed.size} of {VISIBLE_PLATFORMS.length} done
              </span>
            </header>
            <ul className="divide-y divide-[var(--gray-150)]">
              {VISIBLE_PLATFORMS.map((p) => {
                const meta = PLATFORM_META[p];
                const variant = variantByPlatform.get(p);
                const text = variant?.content || item.post.baseContent;
                const isHanded = handed.has(p);
                const busy = busyPlatform === p;
                return (
                  <li
                    key={p}
                    className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span
                        className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                        style={{
                          background: `${meta.color}14`,
                          color: meta.color,
                        }}
                      >
                        <Icon
                          name={meta.icon}
                          weight="fill"
                          className="h-3.5 w-3.5"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--gray-900)]">
                          {PLATFORM_LABELS[p]}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--gray-600)]">
                          {text || (
                            <span className="italic text-[var(--gray-400)]">
                              No variant yet — base copy will be used.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlatform(p)}
                      disabled={busy || !text}
                      aria-busy={busy}
                      className={cn(
                        "inline-flex h-8 shrink-0 items-center gap-1.5 self-end rounded-[var(--radius-md)] border px-3 text-[11px] font-semibold transition-colors sm:self-start disabled:opacity-50",
                        isHanded
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[var(--gray-200)] bg-white text-[var(--gray-700)] hover:border-[var(--violet-300)] hover:bg-[var(--violet-50)] hover:text-[var(--violet-700)]",
                      )}
                    >
                      {isHanded && (
                        <Icon
                          name="CheckCircle"
                          weight="fill"
                          className="h-3 w-3"
                        />
                      )}
                      {busy ? "Opening…" : isHanded ? "Done" : "Hand off"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Step controls */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={safeIndex === 0}
                className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-medium text-[var(--gray-600)] hover:bg-[var(--gray-50)] disabled:opacity-50"
              >
                <Icon name="CaretRight" className="h-3 w-3 rotate-180" />
                Prev
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={safeIndex >= items.length - 1}
                className="inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-medium text-[var(--gray-600)] hover:bg-[var(--gray-50)] disabled:opacity-50"
              >
                Skip
                <Icon name="CaretRight" className="h-3 w-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleMarkPosted}
              disabled={pendingMark}
              aria-busy={pendingMark}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-600)] px-3.5 text-xs font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)] transition-colors hover:bg-[var(--violet-700)] disabled:opacity-60"
            >
              <Icon name="CheckCircle" weight="fill" className="h-3.5 w-3.5" />
              Mark posted &amp; next
            </button>
          </div>
        </div>

        {/* Side: checklist + media */}
        <aside className="space-y-4">
          <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
            <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--gray-900)]">
                Founder checklist
              </h3>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  checkedCount === totalChecks
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)]",
                )}
              >
                {checkedCount}/{totalChecks}
              </span>
            </header>
            <ul className="divide-y divide-[var(--gray-150)]">
              {checklistEntries.map((c) => (
                <li
                  key={c.key}
                  className="flex items-start gap-2 px-4 py-2.5 text-xs"
                >
                  <Icon
                    name={c.checked ? "CheckCircle" : "Circle"}
                    weight={c.checked ? "fill" : "regular"}
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      c.checked
                        ? "text-emerald-500"
                        : "text-[var(--gray-300)]",
                    )}
                  />
                  <span
                    className={cn(
                      c.checked
                        ? "text-[var(--gray-700)]"
                        : "text-[var(--gray-600)]",
                    )}
                  >
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
            <footer className="border-t border-[var(--gray-150)] px-4 py-2">
              <Link
                href={`/compose?id=${item.post.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--violet-600)] hover:underline"
              >
                <Icon name="PencilSimple" className="h-3 w-3" />
                Edit in Compose
              </Link>
            </footer>
          </section>

          {item.media.length > 0 && (
            <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-[var(--gray-900)]">
                Media
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {item.media.map((m, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={m.url}
                    alt={m.alt || "Post media"}
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ))}
              </div>
            </section>
          )}

          {/* List of all visible PLATFORMS we have variants for, beyond what we showed in the main column */}
          {PLATFORMS.length > VISIBLE_PLATFORMS.length && (
            <details className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-4 text-[11px] text-[var(--gray-600)]">
              <summary className="cursor-pointer font-medium text-[var(--gray-700)]">
                Other platforms
              </summary>
              <p className="mt-2">
                Use the queue list to hand off to platforms not shown here.
              </p>
            </details>
          )}
        </aside>
      </article>
    </div>
  );
}
