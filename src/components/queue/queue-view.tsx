"use client";

import type { Ref } from "react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

function pickInitialTab(
  highlightId: string | null | undefined,
  defaultTab: TabId | undefined,
  scheduled: PostRow[],
  ready: PostRow[],
  posted: PostRow[],
): TabId {
  if (highlightId) {
    if (scheduled.some((p) => p.id === highlightId)) return "scheduled";
    if (ready.some((p) => p.id === highlightId)) return "ready";
    if (posted.some((p) => p.id === highlightId)) return "posted";
  }
  return defaultTab ?? "ready";
}
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, isSameDay } from "date-fns";
import { toast } from "sonner";
import type { posts } from "@/db/schema";
import { reschedulePost } from "@/actions/posts";
import { publishPostToBluesky } from "@/actions/connections";
import { HandoffPanel } from "@/components/handoff/handoff-panel";
import { Icon, type IconName } from "@/components/Icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PostRow = typeof posts.$inferSelect;

type Props = {
  scheduled: PostRow[];
  ready: PostRow[];
  posted: PostRow[];
  appNames: Record<string, string>;
  appColors: Record<string, string>;
  highlightId?: string | null;
  defaultTab?: TabId;
  blueskyConnected?: boolean;
};

type TabId = "ready" | "scheduled" | "posted";

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: "ready", label: "Ready", icon: "ShieldCheck" },
  { id: "scheduled", label: "Scheduled", icon: "CalendarBlank" },
  { id: "posted", label: "Posted", icon: "CheckCircle" },
];

export function QueueView({
  scheduled,
  ready,
  posted,
  appNames,
  appColors,
  highlightId,
  defaultTab,
  blueskyConnected = false,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(() =>
    pickInitialTab(highlightId, defaultTab, scheduled, ready, posted),
  );
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Scroll the highlighted card into view after it renders.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
    return () => clearTimeout(t);
  }, [highlightId, tab]);

  const lists: Record<TabId, PostRow[]> = useMemo(() => {
    return {
      ready,
      scheduled: [...scheduled].sort((a, b) => {
        const at = a.scheduledFor
          ? new Date(a.scheduledFor).getTime()
          : Number.POSITIVE_INFINITY;
        const bt = b.scheduledFor
          ? new Date(b.scheduledFor).getTime()
          : Number.POSITIVE_INFINITY;
        return at - bt;
      }),
      posted,
    };
  }, [ready, scheduled, posted]);

  const counts: Record<TabId, number> = {
    ready: ready.length,
    scheduled: scheduled.length,
    posted: posted.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const isActive = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border px-3 text-xs font-medium transition-colors",
                isActive
                  ? "border-[var(--gray-900)] bg-white text-[var(--gray-900)] shadow-sm"
                  : "border-[var(--gray-200)] bg-white text-[var(--gray-600)] hover:border-[var(--gray-300)]",
              )}
            >
              <Icon
                name={t.icon}
                weight={isActive ? "fill" : "regular"}
                className={cn(
                  "h-3.5 w-3.5",
                  isActive ? "text-[var(--violet-600)]" : "text-[var(--gray-400)]",
                )}
              />
              {t.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  isActive
                    ? "bg-[var(--violet-100)] text-[var(--violet-700)]"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)]",
                )}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}

        {ready.length > 0 && (
          <Link
            href="/queue/handoff"
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-600)] px-3 text-xs font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)] transition-colors hover:bg-[var(--violet-700)]"
          >
            <Icon name="Sparkle" weight="fill" className="h-3.5 w-3.5" />
            Run hand-off mode
          </Link>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {lists[tab].length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          lists[tab].map((post) => (
            <PostCard
              key={post.id}
              post={post}
              appName={appNames[post.appId] ?? "App"}
              appColor={appColors[post.appId] ?? "var(--gray-400)"}
              tab={tab}
              isHighlighted={post.id === highlightId}
              onRescheduled={() => router.refresh()}
              blueskyConnected={blueskyConnected}
              ref={post.id === highlightId ? highlightRef : null}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabId }) {
  const copy: Record<TabId, { title: string; body: string; cta: string; href: string }> = {
    ready: {
      title: "No posts ready to hand off",
      body: "Promote scheduled posts to ready when they're approved.",
      cta: "View scheduled",
      href: "/queue?status=scheduled",
    },
    scheduled: {
      title: "Your queue is clear",
      body: "Compose something to keep momentum going.",
      cta: "Compose",
      href: "/compose",
    },
    posted: {
      title: "No posts shipped yet",
      body: "Once you mark posts posted they'll appear here.",
      cta: "View ready",
      href: "/queue?status=ready",
    },
  };
  const c = copy[tab];
  return (
    <div className="md:col-span-2 flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--gray-300)] bg-white px-6 py-12 text-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-400)]">
        <Icon name="Tray" className="h-4 w-4" />
      </span>
      <p className="text-sm font-semibold text-[var(--gray-900)]">{c.title}</p>
      <p className="max-w-sm text-xs text-[var(--gray-600)]">{c.body}</p>
      <Link
        href={c.href}
        className="mt-2 inline-flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-xs font-semibold text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
      >
        {c.cta}
      </Link>
    </div>
  );
}

function PostCard({
  post,
  appName,
  appColor,
  tab,
  isHighlighted,
  onRescheduled,
  blueskyConnected,
  ref,
}: {
  post: PostRow;
  appName: string;
  appColor: string;
  tab: TabId;
  isHighlighted: boolean;
  onRescheduled: () => void;
  blueskyConnected: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  const [pending, startTransition] = useTransition();
  const [editingTime, setEditingTime] = useState(false);
  const [dt, setDt] = useState<string>(() =>
    post.scheduledFor
      ? format(new Date(post.scheduledFor), "yyyy-MM-dd'T'HH:mm")
      : "",
  );

  function saveTime() {
    if (!dt) return;
    startTransition(async () => {
      const res = await reschedulePost(post.id, new Date(dt).toISOString());
      if ("error" in res && res.error) {
        toast.error(String(res.error));
        return;
      }
      toast.success("Rescheduled.");
      setEditingTime(false);
      onRescheduled();
    });
  }

  const checklist = (post.founderChecklistJson ?? {}) as Record<string, boolean>;
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalChecks = Object.keys(checklist).length || 7;

  const when = post.scheduledFor ? new Date(post.scheduledFor) : null;
  const postedAt = post.postedAt ? new Date(post.postedAt) : null;

  return (
    <article
      ref={ref}
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-white p-4 transition-shadow",
        isHighlighted
          ? "border-[var(--violet-400)] shadow-[0_0_0_4px_var(--violet-100)]"
          : "border-[var(--gray-200)]",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: appColor }}
          />
          <p className="min-w-0 truncate text-xs font-semibold text-[var(--gray-900)]">
            {appName}
          </p>
          {post.energyTag && (
            <span className="shrink-0 rounded-full bg-[var(--violet-50)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--violet-700)]">
              {post.energyTag === "high" ? "High energy" : "Low energy"}
            </span>
          )}
          {post.isEvergreen && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              Evergreen
            </span>
          )}
        </div>
        {tab !== "posted" && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
              checkedCount === totalChecks
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[var(--gray-100)] text-[var(--gray-600)]",
            )}
            title={`${checkedCount} of ${totalChecks} checks`}
          >
            {checkedCount}/{totalChecks}
          </span>
        )}
      </header>

      <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--gray-700)]">
        {post.baseContent || (
          <span className="italic text-[var(--gray-400)]">(empty draft)</span>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--gray-500)]">
        {tab === "posted" && postedAt && (
          <>
            <Icon name="CheckCircle" weight="fill" className="h-3 w-3 text-emerald-500" />
            Posted {format(postedAt, "MMM d 'at' h:mm a")}
          </>
        )}
        {tab !== "posted" && when && !editingTime && (
          <>
            <Icon name="ClockClockwise" className="h-3 w-3" />
            <span>
              {isSameDay(when, new Date())
                ? `Today, ${format(when, "h:mm a")}`
                : format(when, "MMM d 'at' h:mm a")}
            </span>
            <span className="text-[var(--gray-400)]">
              · {formatDistanceToNow(when, { addSuffix: true })}
            </span>
            <button
              type="button"
              onClick={() => setEditingTime(true)}
              className="ml-auto text-[10px] font-semibold text-[var(--violet-600)] hover:underline"
            >
              Reschedule
            </button>
          </>
        )}
        {tab !== "posted" && editingTime && (
          <div className="flex w-full items-center gap-1.5">
            <Input
              type="datetime-local"
              value={dt}
              onChange={(e) => setDt(e.target.value)}
              className="h-7 flex-1 text-[11px]"
            />
            <button
              type="button"
              onClick={saveTime}
              disabled={pending}
              className="inline-flex h-7 items-center rounded-md bg-[var(--violet-600)] px-2 text-[10px] font-semibold text-white hover:bg-[var(--violet-700)] disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingTime(false)}
              className="text-[10px] font-semibold text-[var(--gray-500)] hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {tab === "ready" && (
        <div className="flex flex-col gap-2">
          {blueskyConnected && (
            <BlueskyPublishButton
              postId={post.id}
              onPublished={onRescheduled}
            />
          )}
          <HandoffPanel postId={post.id} />
        </div>
      )}

      <footer className="flex items-center justify-between border-t border-[var(--gray-150)] pt-3 text-[11px]">
        <Link
          href={`/compose?id=${post.id}`}
          className="inline-flex items-center gap-1 font-semibold text-[var(--violet-600)] hover:underline"
        >
          <Icon name="PencilSimple" className="h-3 w-3" />
          Edit
        </Link>
        {tab === "scheduled" && (
          <Link
            href="/queue/handoff"
            className="inline-flex items-center gap-1 font-medium text-[var(--gray-600)] hover:text-[var(--gray-900)]"
          >
            Move to ready
            <Icon name="ArrowRight" className="h-3 w-3" />
          </Link>
        )}
      </footer>
    </article>
  );
}

/**
 * One-click direct publish to Bluesky for a ready post. We keep this
 * narrow: optimistic disable while pending, toast outcome, refresh queue.
 * Bluesky is the only platform where we own the publish — everything else
 * still flows through the hand-off walkthrough.
 */
function BlueskyPublishButton({
  postId,
  onPublished,
}: {
  postId: string;
  onPublished: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function publish() {
    startTransition(async () => {
      const res = await publishPostToBluesky(postId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Posted to Bluesky.");
      onPublished();
    });
  }

  return (
    <button
      type="button"
      onClick={publish}
      disabled={pending}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-xs font-semibold transition-colors",
        pending
          ? "cursor-wait bg-[var(--violet-100)] text-[var(--violet-700)]"
          : "bg-[var(--violet-600)] text-white hover:bg-[var(--violet-700)]",
      )}
    >
      <Icon name="PaperPlaneTilt" className="h-3.5 w-3.5" />
      {pending ? "Posting…" : "Post to Bluesky now"}
    </button>
  );
}
