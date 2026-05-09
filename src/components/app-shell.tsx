"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  soon?: boolean;
  badge?: string | number;
  /** Extra paths that should mark this item active. */
  matches?: string[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "SquaresFour" },
  { href: "/compose", label: "Compose", icon: "PencilSimple" },
  {
    href: "/queue",
    label: "Queue",
    icon: "Tray",
    matches: ["/compose/batch"],
  },
  { href: "/queue?view=calendar", label: "Calendar", icon: "CalendarBlank" },
  { href: "/apps", label: "Campaigns", icon: "RocketLaunch" },
  { href: "/library?filter=evergreen", label: "Evergreen", icon: "ArrowsClockwise" },
  { href: "/analytics", label: "Insights", icon: "ChartLineUp" },
  {
    href: "/queue?status=ready",
    label: "Confidence Pass",
    icon: "ShieldCheck",
  },
  { href: "/library", label: "Media", icon: "FileText" },
  { href: "/settings", label: "Settings", icon: "Gear" },
];

export type ChannelApp = {
  id: string;
  name: string;
  color: string;
};

function activeNavHref(pathname: string, search: string) {
  // Best-match using href base path; ignore querystring for nav highlight
  // unless the nav item itself has a search component (e.g. Calendar uses ?view=).
  const matches = NAV.filter((n) => {
    const [base, query] = n.href.split("?");
    if (query) {
      // Item is qualified with a query — only active when query matches too.
      const qs = new URLSearchParams(query);
      const sp = new URLSearchParams(search);
      const allMatch = [...qs.entries()].every(
        ([k, v]) => sp.get(k) === v,
      );
      return pathname === base && allMatch;
    }
    if (pathname === base || pathname.startsWith(`${base}/`)) return true;
    return n.matches?.some(
      (m) => pathname === m || pathname.startsWith(`${m}/`),
    );
  });
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function Wordmark() {
  return (
    <span className="flex items-center gap-1">
      <span className="text-base font-semibold tracking-tight text-[var(--gray-900)]">
        socialella
      </span>
      <Icon
        name="Heart"
        weight="fill"
        className="h-3 w-3 text-[var(--pink-500)]"
        aria-hidden
      />
    </span>
  );
}

function AppRow({
  app,
  active,
  onNavigate,
}: {
  app: ChannelApp;
  active: boolean;
  onNavigate?: () => void;
}) {
  const initial = app.name.trim().charAt(0).toUpperCase() || "•";
  return (
    <Link
      href={`/queue?app=${app.id}`}
      onClick={() => onNavigate?.()}
      className={cn(
        "group flex h-10 items-center gap-2.5 rounded-[var(--radius-md)] pl-2 pr-2 text-sm transition-colors",
        active
          ? "bg-[var(--violet-50)] text-[var(--violet-700)]"
          : "text-[var(--gray-700)] hover:bg-[var(--gray-50)]",
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white shadow-sm"
        style={{ backgroundColor: app.color || "#7c3aed" }}
      >
        {initial}
      </span>
      <span className="truncate font-medium">{app.name}</span>
      {active && (
        <span
          aria-hidden
          className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--violet-500)]"
        />
      )}
    </Link>
  );
}

function AppsSection({
  apps,
  activeAppId,
  onNavigate,
}: {
  apps: ChannelApp[];
  activeAppId?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--gray-400)]">
          Apps
        </p>
        <Link
          href="/apps"
          onClick={() => onNavigate?.()}
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[var(--violet-600)] hover:underline"
        >
          <Icon name="Plus" weight="bold" className="h-3 w-3" />
          Add app
        </Link>
      </div>
      {apps.length === 0 ? (
        <Link
          href="/apps"
          onClick={() => onNavigate?.()}
          className="flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--gray-200)] px-2.5 text-xs text-[var(--gray-500)] hover:bg-[var(--gray-50)]"
        >
          <Icon name="Plus" className="h-3 w-3" />
          Add your first app
        </Link>
      ) : (
        apps.map((app) => (
          <AppRow
            key={app.id}
            app={app}
            active={activeAppId === app.id}
            onNavigate={onNavigate}
          />
        ))
      )}
    </div>
  );
}

function NavLinks({
  activeHref,
  onNavigate,
}: {
  activeHref: string | undefined;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {NAV.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              "group flex h-9 items-center gap-2.5 rounded-[var(--radius-md)] px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet-500)]",
              active
                ? "bg-[var(--violet-50)] font-semibold text-[var(--violet-700)]"
                : "font-medium text-[var(--gray-700)] hover:bg-[var(--gray-50)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              name={item.icon}
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active
                  ? "text-[var(--violet-600)]"
                  : "text-[var(--gray-500)]",
              )}
              weight={active ? "fill" : "regular"}
            />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  active
                    ? "bg-[var(--violet-200)] text-[var(--violet-800)]"
                    : "bg-[var(--gray-100)] text-[var(--gray-600)]",
                )}
              >
                {item.badge}
              </span>
            )}
            {item.soon && (
              <span className="rounded-full bg-[var(--gray-100)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--gray-400)]">
                Soon
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function FreeUpgradeCard() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--gray-200)] bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--violet-100)] text-[var(--violet-700)]">
          <Icon name="Sparkle" weight="fill" className="h-3 w-3" />
        </span>
        <p className="text-xs font-semibold text-[var(--gray-900)]">
          You&apos;re on{" "}
          <span className="text-[var(--violet-600)]">Free</span>
        </p>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-[var(--gray-500)]">
        Hand-off mode
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-[var(--gray-600)]">
        Upgrade anytime for auto-posting, inbox &amp; more.
      </p>
      <Link
        href="/connections"
        className="mt-2.5 inline-flex h-8 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--violet-600)] text-xs font-semibold text-white transition-colors hover:bg-[var(--violet-700)]"
      >
        View upgrades
      </Link>
    </div>
  );
}

function SidebarBody({
  apps,
  activeHref,
  activeAppId,
  onNavigate,
}: {
  apps: ChannelApp[];
  activeHref: string | undefined;
  activeAppId: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        <AppsSection
          apps={apps}
          activeAppId={activeAppId}
          onNavigate={onNavigate}
        />
        <div className="border-t border-[var(--gray-150)] pt-3">
          <NavLinks activeHref={activeHref} onNavigate={onNavigate} />
        </div>
      </div>
      <div className="border-t border-[var(--gray-150)] p-3">
        <FreeUpgradeCard />
      </div>
    </div>
  );
}

export function AppShell({
  apps,
  children,
}: {
  apps: ChannelApp[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const activeHref = activeNavHref(pathname, searchParams.toString());
  const activeAppId = searchParams.get("app");

  return (
    <div
      className="flex min-h-full flex-col lg:flex-row"
      style={
        {
          // Scope accent to the app shell.
          ["--color-accent" as string]: "var(--violet-600)",
          ["--color-accent-hover" as string]: "var(--violet-700)",
          ["--color-accent-soft" as string]: "var(--violet-50)",
          ["--color-accent-soft-text" as string]: "var(--violet-700)",
        } as React.CSSProperties
      }
    >
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--gray-150)] lg:bg-white lg:min-h-screen lg:sticky lg:top-0 lg:self-start">
        <div className="flex h-16 items-center px-4">
          <Link
            href="/dashboard"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet-500)]"
          >
            <Wordmark />
          </Link>
        </div>
        <SidebarBody
          apps={apps}
          activeHref={activeHref}
          activeAppId={activeAppId}
        />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-[var(--gray-150)] bg-white/95 px-4 backdrop-blur lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Icon name="SidebarSimple" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-4 pt-5 pb-3">
              <DialogTitle asChild>
                <Wordmark />
              </DialogTitle>
            </DialogHeader>
            <SidebarBody
              apps={apps}
              activeHref={activeHref}
              activeAppId={activeAppId}
              onNavigate={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <Wordmark />
        <div aria-hidden className="w-10" />
      </header>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-x-hidden bg-[var(--gray-50)]">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
