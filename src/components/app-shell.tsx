"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NAV_PRIMARY = [
  { href: "/", label: "Dashboard", icon: "Sparkle" as const },
  { href: "/queue", label: "Queue", icon: "CalendarBlank" as const },
  { href: "/compose", label: "Compose", icon: "ClipboardText" as const },
  { href: "/compose/batch", label: "Batch", icon: "ListBullets" as const },
  { href: "/library", label: "Library", icon: "Tray" as const },
];

const NAV_SECONDARY = [
  { href: "/apps", label: "Apps", icon: "RocketLaunch" as const },
  { href: "/connections", label: "Connections", icon: "UsersThree" as const },
  { href: "/safety", label: "Safety", icon: "ShieldCheck" as const },
  { href: "/settings", label: "Settings", icon: "Lightning" as const },
];

const ALL_NAV = [...NAV_PRIMARY, ...NAV_SECONDARY];

export type ChannelApp = {
  id: string;
  name: string;
  color: string;
};

function activeNavHref(pathname: string) {
  const matches = ALL_NAV.filter((n) =>
    n.href === "/"
      ? pathname === "/"
      : pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[var(--indigo-600)] text-white"
      >
        <span className="text-sm font-bold">S</span>
      </span>
      <span className="text-base font-semibold tracking-tight text-[var(--gray-900)]">
        Socialella
      </span>
    </span>
  );
}

function NavSection({
  items,
  activeHref,
  onNavigate,
  label,
}: {
  items: typeof ALL_NAV;
  activeHref: string | undefined;
  onNavigate?: () => void;
  label?: string;
}) {
  return (
    <div className="space-y-0.5">
      {label && (
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--sidebar-text-muted)]">
          {label}
        </p>
      )}
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onNavigate?.()}
            className={cn(
              "group flex h-9 items-center gap-2.5 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--indigo-500)]",
              active
                ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]"
                : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              name={item.icon}
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active && "text-[var(--sidebar-active-text)]",
              )}
              weight={active ? "fill" : "regular"}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function ChannelsSection({
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
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--sidebar-text-muted)]">
          Channels
        </p>
        <Link
          href="/apps"
          onClick={() => onNavigate?.()}
          className="text-[11px] font-medium text-[var(--color-accent)] hover:underline"
        >
          Manage
        </Link>
      </div>
      {apps.length === 0 ? (
        <Link
          href="/apps"
          onClick={() => onNavigate?.()}
          className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--sidebar-border)] px-3 text-xs text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover-bg)]"
        >
          <span aria-hidden>+</span> Add an app
        </Link>
      ) : (
        apps.map((app) => {
          const active = activeAppId === app.id;
          return (
            <Link
              key={app.id}
              href={`/queue?app=${app.id}`}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex h-9 items-center gap-2.5 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--indigo-500)]",
                active
                  ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]"
                  : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)]",
              )}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
                style={{ backgroundColor: app.color || "#6366f1" }}
              />
              <span className="truncate">{app.name}</span>
            </Link>
          );
        })
      )}
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

  const activeHref = activeNavHref(pathname);
  const activeAppId =
    pathname === "/queue" ? searchParams.get("app") : null;

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col gap-1 px-3 pb-4">
      <NavSection
        items={NAV_PRIMARY}
        activeHref={activeHref}
        onNavigate={onNavigate}
      />
      <ChannelsSection
        apps={apps}
        activeAppId={activeAppId}
        onNavigate={onNavigate}
      />
      <NavSection
        items={NAV_SECONDARY}
        activeHref={activeHref}
        onNavigate={onNavigate}
        label="Workspace"
      />
      <div className="mt-auto border-t border-[var(--sidebar-border)] pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-[var(--sidebar-border)] lg:bg-[var(--sidebar-bg)] lg:min-h-screen lg:sticky lg:top-0 lg:self-start">
        <div className="flex h-14 items-center px-5">
          <Link
            href="/"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--indigo-500)]"
          >
            <Wordmark />
          </Link>
        </div>
        <SidebarBody />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 px-4 backdrop-blur lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Icon name="SidebarSimple" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle asChild>
                <Wordmark />
              </DialogTitle>
            </DialogHeader>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
        <Wordmark />
        <div aria-hidden className="w-10" />
      </header>

      {/* Main content */}
      <main className="flex-1 bg-[var(--color-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
