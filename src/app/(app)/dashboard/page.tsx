import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { getSession } from "@/lib/session";
import {
  getAppCoverage,
  getCampaignProgress,
  getConfidencePassCount,
  getDashboardInsights,
  getDashboardKpis,
  getRecentDrafts,
  getSampleMetrics,
  getTodaysScheduled,
  getWeekCalendar,
  type DashboardInsight,
  type DashboardMetricCard,
} from "@/lib/data";
import { Icon, type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatCount(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(n >= 10_000 ? 1 : 1)}K`.replace(".0K", "K");
  }
  return n.toString();
}

function safeIcon(name: string): IconName {
  // narrow runtime string to IconName for the sample metrics
  return name as IconName;
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function DashboardHeader({ name }: { name: string }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-[var(--gray-900)]">
          Dashboard
        </h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-[var(--gray-600)]">
          Welcome back, {name}{" "}
          <span aria-hidden className="text-base">
            👋
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white px-3 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
        >
          <Icon
            name="CalendarBlank"
            className="h-3.5 w-3.5 text-[var(--gray-400)]"
          />
          This week
          <Icon name="CaretDown" className="h-3 w-3 text-[var(--gray-400)]" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--gray-200)] bg-white text-[var(--gray-600)] hover:bg-[var(--gray-50)]"
        >
          <Icon name="Bell" className="h-4 w-4" />
        </button>
        <Link
          href="/settings"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--gray-200)] bg-white pl-1 pr-3 hover:bg-[var(--gray-50)]"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--violet-100)] text-xs font-semibold text-[var(--violet-700)]">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold text-[var(--gray-900)]">
              {name}
            </span>
            <span className="text-[10px] text-[var(--gray-500)]">
              Indie founder
            </span>
          </span>
          <Icon name="CaretDown" className="h-3 w-3 text-[var(--gray-400)]" />
        </Link>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

function Sparkline({
  data,
  color,
  className,
}: {
  data: number[];
  color: string;
  className?: string;
}) {
  if (data.length < 2) return <div className={className} />;
  const w = 200;
  const h = 48;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / range) * h;
    return [x, y] as [number, number];
  });

  // Smooth path using simple bezier between points.
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    const mx = (x1 + x2) / 2;
    d += ` Q ${mx} ${y1} ${x2} ${y2}`;
  }
  const areaD = `${d} L ${points[points.length - 1][0]} ${h} L ${points[0][0]} ${h} Z`;

  const gradId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-12 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card                                                            */
/* ------------------------------------------------------------------ */

function KpiCard({ metric }: { metric: DashboardMetricCard }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--gray-500)]">
        <Icon name={safeIcon(metric.iconName)} className="h-3.5 w-3.5" />
        {metric.label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-[22px] font-bold leading-none tracking-tight text-[var(--gray-900)]">
          {formatCount(metric.value)}
        </p>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[11px] font-semibold",
            metric.deltaPct >= 0
              ? "text-[var(--success-600)]"
              : "text-[var(--danger-600)]",
          )}
        >
          <Icon
            name={metric.deltaPct >= 0 ? "ArrowUp" : "ArrowDown"}
            weight="bold"
            className="h-2.5 w-2.5"
          />
          {Math.abs(metric.deltaPct)}%
        </span>
      </div>
      <p className="mt-0.5 text-[10px] text-[var(--gray-400)]">
        vs last 7 days
      </p>
      <Sparkline
        data={metric.series}
        color={metric.color}
        className="mt-2"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Today's queue panel                                                 */
/* ------------------------------------------------------------------ */

const PLATFORM_ICONS: Record<
  string,
  { name: IconName; label: string; color: string }
> = {
  x: { name: "XLogo", label: "X (Twitter)", color: "#0f172a" },
  twitter: { name: "XLogo", label: "X (Twitter)", color: "#0f172a" },
  linkedin: { name: "LinkedinLogo", label: "LinkedIn", color: "#0a66c2" },
  instagram: {
    name: "InstagramLogo",
    label: "Instagram",
    color: "#db2777",
  },
  tiktok: { name: "TiktokLogo", label: "TikTok", color: "#0f172a" },
};

function platformBadge(energy?: string | null, fallback = "x") {
  // We don't actually know per-post platform yet (each post can have many
  // variants). Cycle through a default set so the right column shows variety.
  const order = ["x", "linkedin", "instagram", "tiktok"];
  const key = energy && PLATFORM_ICONS[energy] ? energy : fallback;
  void order;
  return PLATFORM_ICONS[key] ?? PLATFORM_ICONS.x;
}

type QueuePost = {
  id: string;
  scheduledFor: Date | null;
  baseContent: string;
  energyTag: string | null;
};

function MiniPostPreview({ index }: { index: number }) {
  const palettes = [
    "linear-gradient(135deg, var(--violet-100) 0%, var(--gray-100) 100%)",
    "linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%)",
    "linear-gradient(135deg, var(--pink-100) 0%, var(--violet-50) 100%)",
  ];
  return (
    <div
      className="h-14 w-10 shrink-0 rounded-md border border-[var(--gray-200)]"
      style={{ background: palettes[index % palettes.length] }}
      aria-hidden
    />
  );
}

function QueuePostRow({
  post,
  index,
  fallbackPlatform,
}: {
  post: QueuePost;
  index: number;
  fallbackPlatform: string;
}) {
  const platform = platformBadge(null, fallbackPlatform);
  return (
    <li className="px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="flex items-center gap-1.5 text-[var(--gray-500)]">
          <span className="font-semibold text-[var(--gray-700)]">
            {post.scheduledFor
              ? format(new Date(post.scheduledFor), "h:mm a")
              : "—"}
          </span>
          <Icon
            name={platform.name}
            className="h-3 w-3"
            style={{ color: platform.color }}
          />
          <span>{platform.label}</span>
        </span>
        <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
          Ready
        </span>
      </div>
      <div className="flex items-start gap-3">
        <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-[var(--gray-700)]">
          {post.baseContent || (
            <span className="italic text-[var(--gray-400)]">
              (empty draft)
            </span>
          )}
        </p>
        <MiniPostPreview index={index} />
      </div>
      <div className="mt-2 flex items-center gap-2 text-[var(--gray-400)]">
        <Icon name="ImageSquare" className="h-3 w-3" />
        <Icon name="LinkSimple" className="h-3 w-3" />
      </div>
    </li>
  );
}

function TodaysQueuePanel({
  posts,
  totalToday,
}: {
  posts: QueuePost[];
  totalToday: number;
}) {
  const platformCycle = ["x", "linkedin", "instagram"];
  return (
    <section className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold text-[var(--gray-900)]">
            Today&apos;s queue
          </h2>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--violet-100)] px-1.5 text-[10px] font-bold text-[var(--violet-700)]">
            {totalToday}
          </span>
        </div>
        <Link
          href="/queue"
          className="text-[11px] font-medium text-[var(--violet-600)] hover:underline"
        >
          View calendar
        </Link>
      </header>
      <div className="flex-1 overflow-hidden">
        {posts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-400)]">
              <Icon name="CalendarBlank" className="h-4 w-4" />
            </span>
            <p className="text-xs font-medium text-[var(--gray-700)]">
              Nothing scheduled today
            </p>
            <p className="text-[11px] text-[var(--gray-500)]">
              Compose something to fill your queue.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--gray-150)]">
            {posts.slice(0, 3).map((p, i) => (
              <QueuePostRow
                key={p.id}
                post={p}
                index={i}
                fallbackPlatform={platformCycle[i % platformCycle.length]}
              />
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-[var(--gray-150)] p-3">
        <Link
          href="/queue/handoff"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--violet-600)] text-xs font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.6)] transition-colors hover:bg-[var(--violet-700)]"
        >
          <Icon name="Sparkle" weight="fill" className="h-3.5 w-3.5" />
          Open next in hand-off mode
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* What changed — insights with illustration                           */
/* ------------------------------------------------------------------ */

type InsightVisual = {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  pillLabel: string;
  pillTone: "success" | "pink" | "violet" | "amber";
};

function visualForInsight(insight: DashboardInsight): InsightVisual {
  switch (insight.tone) {
    case "success":
      return {
        icon: "TrendUp",
        iconColor: "var(--success-600)",
        iconBg: "#dcfce7",
        pillLabel: "Going well",
        pillTone: "success",
      };
    case "warning":
      return {
        icon: "Lightning",
        iconColor: "#b45309",
        iconBg: "#fef3c7",
        pillLabel: "Needs attention",
        pillTone: "amber",
      };
    case "info":
    default:
      return {
        icon: "Sparkle",
        iconColor: "var(--violet-600)",
        iconBg: "var(--violet-100)",
        pillLabel: "Heads up",
        pillTone: "violet",
      };
  }
}

function FounderIllustration() {
  // Simple, friendly line-art figure of someone at a laptop with coffee.
  return (
    <svg
      viewBox="0 0 220 180"
      className="h-full w-full"
      role="img"
      aria-label="Illustration of a founder at a laptop"
    >
      <g
        fill="none"
        stroke="var(--gray-700)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* hair */}
        <path d="M70 38 C 65 28, 95 20, 105 28 C 115 22, 130 30, 128 42 C 138 48, 132 60, 124 60 L 76 60 C 68 58, 64 48, 70 38 Z" fill="var(--violet-100)" />
        {/* face */}
        <path d="M82 60 C 78 75, 86 88, 100 88 C 116 88, 122 78, 120 62" />
        {/* eyes */}
        <circle cx="92" cy="68" r="1.4" fill="var(--gray-700)" />
        <circle cx="110" cy="68" r="1.4" fill="var(--gray-700)" />
        {/* smile */}
        <path d="M95 76 C 99 80, 105 80, 109 76" />
        {/* body */}
        <path d="M68 130 C 70 105, 82 90, 100 90 C 118 90, 132 105, 134 130" fill="white" />
        {/* arm holding mug */}
        <path d="M65 132 C 50 128, 42 118, 40 110" />
        <rect x="34" y="100" width="14" height="12" rx="2" fill="var(--pink-100)" />
        <path d="M48 102 C 54 102, 54 110, 48 110" />
        {/* laptop */}
        <rect x="78" y="120" width="84" height="46" rx="4" fill="var(--gray-100)" />
        <rect x="84" y="124" width="72" height="36" rx="2" fill="white" />
        <path d="M66 168 L 174 168" />
        {/* sparkle accents */}
        <path
          d="M170 50 L 172 56 L 178 58 L 172 60 L 170 66 L 168 60 L 162 58 L 168 56 Z"
          fill="var(--violet-300)"
          stroke="none"
        />
        <circle cx="190" cy="80" r="3" fill="var(--pink-300)" stroke="none" />
        <circle cx="42" cy="62" r="2" fill="var(--violet-300)" stroke="none" />
      </g>
    </svg>
  );
}

function WhatChangedPanel({
  insights,
  shippedThisRange,
}: {
  insights: DashboardInsight[];
  shippedThisRange: number;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-start justify-between gap-2 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--gray-900)]">
            What changed?
          </h2>
          <p className="mt-0.5 text-xs text-[var(--gray-500)]">
            From your queue history — {shippedThisRange} shipped in the last 30
            days.
          </p>
        </div>
        <Link
          href="/analytics"
          className="rounded-md border border-[var(--gray-200)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
        >
          View full insights
        </Link>
      </header>
      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-[1fr_180px]">
        <ul className="space-y-3">
          {insights.map((insight) => {
            const v = visualForInsight(insight);
            return (
              <li
                key={insight.id}
                className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--gray-50)]/70 p-3"
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: v.iconBg, color: v.iconColor }}
                >
                  <Icon name={v.icon} weight="fill" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-[var(--gray-900)]">
                    {insight.title}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-[var(--gray-600)]">
                    {insight.detail}
                  </p>
                  {insight.href && insight.cta && (
                    <Link
                      href={insight.href}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--violet-600)] hover:underline"
                    >
                      {insight.cta}
                      <Icon name="ArrowRight" className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 self-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    v.pillTone === "success" &&
                      "bg-emerald-50 text-emerald-700",
                    v.pillTone === "pink" &&
                      "bg-[var(--pink-100)] text-[var(--pink-600)]",
                    v.pillTone === "violet" &&
                      "bg-[var(--violet-100)] text-[var(--violet-700)]",
                    v.pillTone === "amber" && "bg-amber-50 text-amber-700",
                  )}
                >
                  {v.pillLabel}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="hidden items-center justify-center sm:flex">
          <FounderIllustration />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Campaigns table                                                     */
/* ------------------------------------------------------------------ */

const CAMPAIGN_ICONS: IconName[] = [
  "ClockClockwise",
  "PaperPlaneTilt",
  "UsersThree",
  "Sparkle",
];
const CAMPAIGN_TINTS = [
  "var(--violet-100)",
  "var(--pink-100)",
  "#fef3c7",
  "#dcfce7",
];

function CampaignsPanel({
  campaigns,
}: {
  campaigns: Awaited<ReturnType<typeof getCampaignProgress>>;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--gray-900)]">
          Campaigns
        </h2>
        <Link
          href="/apps"
          className="text-[11px] font-medium text-[var(--violet-600)] hover:underline"
        >
          View all
        </Link>
      </header>
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-400)]">
            <Icon name="RocketLaunch" className="h-4 w-4" />
          </span>
          <p className="text-xs font-medium text-[var(--gray-700)]">
            No campaigns yet
          </p>
          <Link
            href="/apps"
            className="text-[11px] font-medium text-[var(--violet-600)] hover:underline"
          >
            Create one
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--gray-150)]">
          {campaigns.slice(0, 4).map((c, i) => {
            const planned = c.planned || 0;
            const pct = planned
              ? Math.min(100, Math.round((c.postedCount / planned) * 100))
              : 0;
            const isPlanning = planned > 0 && c.postedCount === 0;
            return (
              <li
                key={c.campaign.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-sm sm:flex-nowrap"
              >
                <span
                  aria-hidden
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--gray-700)]"
                  style={{ background: CAMPAIGN_TINTS[i % CAMPAIGN_TINTS.length] }}
                >
                  <Icon
                    name={CAMPAIGN_ICONS[i % CAMPAIGN_ICONS.length]}
                    className="h-4 w-4"
                  />
                </span>
                <p className="min-w-0 flex-1 truncate font-medium text-[var(--gray-900)]">
                  {c.campaign.name}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isPlanning
                      ? "bg-[var(--gray-100)] text-[var(--gray-600)]"
                      : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {isPlanning ? "Planning" : "Active"}
                </span>
                <span className="hidden shrink-0 text-xs tabular-nums text-[var(--gray-500)] sm:inline">
                  {planned ? `${planned} posts` : `${c.postedCount} posts`}
                </span>
                <div className="flex w-full shrink-0 items-center gap-2 sm:w-[120px]">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--gray-100)]"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[var(--violet-500)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-[var(--gray-700)]">
                    {pct}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Content calendar                                                    */
/* ------------------------------------------------------------------ */

function ContentCalendarPanel({
  days,
}: {
  days: Awaited<ReturnType<typeof getWeekCalendar>>;
}) {
  const totalQueued = days.reduce((s, d) => s + d.queued, 0);
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--gray-900)]">
          Content calendar
        </h2>
        <Link
          href="/queue?view=calendar"
          className="text-[11px] font-medium text-[var(--violet-600)] hover:underline"
        >
          View calendar
        </Link>
      </header>
      <div className="px-4 py-4">
        <ul className="grid grid-cols-7 gap-1.5">
          {days.map((d) => (
            <li key={d.iso}>
              <Link
                href={`/queue?view=calendar&day=${d.iso}`}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-[11px] transition-colors",
                  d.isToday
                    ? "border-[var(--violet-500)] bg-[var(--violet-500)] text-white shadow-sm"
                    : "border-[var(--gray-200)] bg-white text-[var(--gray-600)] hover:bg-[var(--gray-50)]",
                )}
              >
                <span className="font-medium">{d.weekday}</span>
                <span
                  className={cn(
                    "text-base font-semibold",
                    d.isToday
                      ? "text-white"
                      : "text-[var(--gray-900)]",
                  )}
                >
                  {d.day}
                </span>
                <span className="flex h-2 items-center gap-0.5">
                  {d.queued > 0 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        d.isToday ? "bg-white/80" : "bg-[var(--violet-400)]",
                      )}
                    />
                  )}
                  {d.posted > 0 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        d.isToday ? "bg-white/80" : "bg-emerald-400",
                      )}
                    />
                  )}
                  {d.draft > 0 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        d.isToday ? "bg-white/80" : "bg-[var(--gray-300)]",
                      )}
                    />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--gray-500)]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--violet-400)]" />
            Queued
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Posted
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--gray-300)]" />
            Draft
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md bg-[var(--violet-50)] px-3 py-2 text-[11px] text-[var(--gray-700)]">
          <Icon
            name="Sparkle"
            weight="fill"
            className="h-3 w-3 text-[var(--violet-600)]"
          />
          {totalQueued > 0 ? (
            <>
              You have{" "}
              <span className="font-semibold text-[var(--gray-900)]">
                {totalQueued} {totalQueued === 1 ? "post" : "posts"}
              </span>{" "}
              scheduled this week
              <span className="ml-auto text-[var(--violet-700)]">
                Great consistency!
              </span>
            </>
          ) : (
            <>
              Empty week ahead — schedule your first post to keep momentum.
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Evergreen + Confidence side cards                                   */
/* ------------------------------------------------------------------ */

function EvergreenCard({ count }: { count: number }) {
  return (
    <Link
      href="/library?filter=evergreen"
      className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-1.5">
          <Icon
            name="ArrowsClockwise"
            className="h-3.5 w-3.5 text-emerald-600"
          />
          <p className="text-sm font-semibold text-[var(--gray-900)]">
            Evergreen posts
          </p>
          <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--gray-100)] px-1.5 text-[10px] font-bold text-[var(--gray-600)]">
            {count}
          </span>
        </div>
        <p className="text-[11px] font-medium text-[var(--gray-700)]">
          {count > 0
            ? `${count} ${count === 1 ? "post" : "posts"} ready to re-surface`
            : "Mark posts evergreen to recycle them"}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--gray-500)]">
          {count > 0 ? "Next up in 12 days" : "Re-surfaces respect a 14-day cooldown"}
        </p>
      </div>
      <div
        aria-hidden
        className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-[var(--gray-900)] p-2 text-[8px] font-medium leading-tight text-white"
      >
        Focus is a superpower.
      </div>
    </Link>
  );
}

function ConfidencePassCard({ count }: { count: number }) {
  return (
    <Link
      href="/queue/handoff"
      className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-1.5">
          <Icon
            name="ShieldCheck"
            className="h-3.5 w-3.5 text-[var(--violet-600)]"
          />
          <p className="text-sm font-semibold text-[var(--gray-900)]">
            Confidence pass
          </p>
          <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--violet-100)] px-1.5 text-[10px] font-bold text-[var(--violet-700)]">
            {count}
          </span>
        </div>
        <p className="text-[11px] font-medium text-[var(--gray-700)]">
          {count > 0
            ? `${count} ${count === 1 ? "post needs" : "posts need"} your review`
            : "Inbox clear — nothing to review"}
        </p>
        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--gray-500)]">
          {count > 0 ? "Keep your tone on point" : "We'll flag tone slips when they happen"}
          <Icon
            name="Heart"
            weight="fill"
            className="h-3 w-3 text-[var(--pink-500)]"
          />
        </p>
      </div>
      <Icon
        name="CaretRight"
        className="h-4 w-4 text-[var(--gray-400)] transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Recently drafted                                                    */
/* ------------------------------------------------------------------ */

const DRAFT_PALETTES = [
  "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
  "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
  "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
  "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
];

function DraftCard({
  post,
  index,
}: {
  post: Awaited<ReturnType<typeof getRecentDrafts>>[number];
  index: number;
}) {
  const platform = platformBadge(null, ["x", "linkedin", "instagram", "tiktok"][index % 4]);
  return (
    <article className="flex w-[230px] shrink-0 flex-col rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-3">
      <div className="flex items-center gap-1.5 text-[11px]">
        <Icon
          name={platform.name}
          className="h-3 w-3"
          style={{ color: platform.color }}
        />
        <span className="font-medium text-[var(--gray-700)]">Draft</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--gray-700)]">
        {post.baseContent || (
          <span className="italic text-[var(--gray-400)]">(empty draft)</span>
        )}
      </p>
      <div
        aria-hidden
        className="mt-3 h-20 rounded-md"
        style={{ background: DRAFT_PALETTES[index % DRAFT_PALETTES.length] }}
      />
      <p className="mt-2 text-[10px] text-[var(--gray-500)]">
        Edited{" "}
        {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true })}
      </p>
    </article>
  );
}

function RecentlyDraftedPanel({
  drafts,
}: {
  drafts: Awaited<ReturnType<typeof getRecentDrafts>>;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--gray-150)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--gray-900)]">
          Recently drafted
        </h2>
        <Link
          href="/library"
          className="text-[11px] font-medium text-[var(--violet-600)] hover:underline"
        >
          View all drafts
        </Link>
      </header>
      <div className="relative px-4 py-4">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--gray-100)] text-[var(--gray-400)]">
              <Icon name="Notepad" className="h-4 w-4" />
            </span>
            <p className="text-xs font-medium text-[var(--gray-700)]">
              No drafts yet
            </p>
            <Link
              href="/compose"
              className="text-[11px] font-medium text-[var(--violet-600)] hover:underline"
            >
              Start composing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex gap-3 pr-12">
              {drafts.map((d, i) => (
                <DraftCard key={d.id} post={d} index={i} />
              ))}
            </div>
            <button
              type="button"
              aria-label="Scroll drafts"
              className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--gray-200)] bg-white text-[var(--gray-600)] shadow-sm hover:bg-[var(--gray-50)]"
            >
              <Icon name="CaretRight" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick actions                                                       */
/* ------------------------------------------------------------------ */

function QuickActions() {
  const actions: {
    href: string;
    label: string;
    icon: IconName;
    tint: string;
    iconColor: string;
  }[] = [
    {
      href: "/compose",
      label: "Compose new post",
      icon: "PencilSimple",
      tint: "var(--violet-100)",
      iconColor: "var(--violet-700)",
    },
    {
      href: "/library",
      label: "Add media",
      icon: "ImageSquare",
      tint: "var(--pink-100)",
      iconColor: "var(--pink-600)",
    },
    {
      href: "/apps",
      label: "Create campaign",
      icon: "Flag",
      tint: "#fef3c7",
      iconColor: "#b45309",
    },
    {
      href: "/analytics",
      label: "View insights",
      icon: "ChartLineUp",
      tint: "#dcfce7",
      iconColor: "var(--success-600)",
    },
  ];
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--gray-900)]">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--gray-200)] bg-white p-3 text-center transition-all hover:border-[var(--violet-200)] hover:bg-[var(--gray-50)]"
          >
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-md"
              style={{ background: a.tint, color: a.iconColor }}
            >
              <Icon name={a.icon} weight="fill" className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-medium leading-tight text-[var(--gray-700)]">
              {a.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
  const session = await getSession();
  const fullName = session.user.name;
  const firstName = fullName.split(" ")[0];

  const [
    today,
    coverage,
    campaigns,
    insights,
    kpis,
    metrics,
    weekDays,
    drafts,
    confidenceCount,
  ] = await Promise.all([
    getTodaysScheduled(),
    getAppCoverage(),
    getCampaignProgress(),
    getDashboardInsights(),
    getDashboardKpis(30),
    Promise.resolve(getSampleMetrics()),
    getWeekCalendar(),
    getRecentDrafts(6),
    getConfidencePassCount(),
  ]);

  // Suppress unused warnings — these power future panels.
  void coverage;
  const shippedCount = kpis.shippedThisRange;

  const evergreenPool = drafts.filter((d) => d.isEvergreen).length;
  const queuePosts: QueuePost[] = today.map((p) => ({
    id: p.id,
    scheduledFor: p.scheduledFor ?? null,
    baseContent: p.baseContent,
    energyTag: p.energyTag,
  }));

  return (
    <div className="space-y-5">
      <DashboardHeader name={firstName} />

      <p className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--violet-50)] px-3 py-1.5 text-[11px] text-[var(--gray-700)]">
        <Icon
          name="Sparkle"
          weight="fill"
          className="h-3 w-3 text-[var(--violet-600)]"
        />
        <span>
          <span className="font-semibold text-[var(--gray-900)]">
            Sample metrics shown.
          </span>{" "}
          Reach, engagement, and follower numbers go live once a platform API
          is connected.{" "}
          <Link
            href="/connections"
            className="font-medium text-[var(--violet-700)] hover:underline"
          >
            Connect →
          </Link>
        </span>
      </p>

      {/* Top: KPIs + today's queue side panel */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <KpiCard key={m.id} metric={m} />
          ))}
        </div>
        <div className="min-w-0 lg:row-span-3">
          <TodaysQueuePanel
            posts={queuePosts}
            totalToday={today.length}
          />
        </div>

        <div className="min-w-0 lg:col-start-1">
          <WhatChangedPanel
            insights={insights}
            shippedThisRange={shippedCount}
          />
        </div>

        <div className="grid min-w-0 gap-4 lg:col-start-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <CampaignsPanel campaigns={campaigns} />
          <ContentCalendarPanel days={weekDays} />
        </div>
      </section>

      {/* Lower row: drafts | side cards */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <RecentlyDraftedPanel drafts={drafts} />
        </div>
        <div className="min-w-0 space-y-3">
          <EvergreenCard count={evergreenPool} />
          <ConfidencePassCard count={confidenceCount} />
          <QuickActions />
        </div>
      </section>
    </div>
  );
}
