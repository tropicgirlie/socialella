"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChannelApp } from "@/components/app-shell";

const RANGE_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
] as const;

type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

function isRange(v: string | null | undefined): v is RangeValue {
  return v === "7d" || v === "30d" || v === "90d";
}

export function TopBar({ apps }: { apps: ChannelApp[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const rangeParam = searchParams.get("range");
  const range: RangeValue = isRange(rangeParam) ? rangeParam : "30d";

  const channelParam = searchParams.get("app");
  const activeChannel = useMemo(
    () => apps.find((a) => a.id === channelParam),
    [apps, channelParam],
  );

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/library?q=${encodeURIComponent(q)}`);
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)]/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10",
        isPending && "opacity-90",
      )}
    >
      {/* Workspace label — single workspace for now */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]"
          >
            <span
              aria-hidden
              className="inline-flex h-4 w-4 items-center justify-center rounded-[3px] bg-[var(--indigo-600)] text-[10px] font-bold text-white"
            >
              S
            </span>
            <span>Personal</span>
            <Icon name="CaretDown" className="h-3 w-3 text-[var(--color-text-subtle)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Workspace
          </DropdownMenuLabel>
          <DropdownMenuItem disabled>Personal</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs text-[var(--color-text-muted)]">
            Teams coming later
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span aria-hidden className="text-[var(--color-text-subtle)]">/</span>

      {/* Date range */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]"
          >
            <Icon name="CalendarBlank" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
            <span>{RANGE_OPTIONS.find((r) => r.value === range)?.label}</span>
            <Icon name="CaretDown" className="h-3 w-3 text-[var(--color-text-subtle)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {RANGE_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => setParam("range", opt.value === "30d" ? null : opt.value)}
              className={cn(opt.value === range && "font-semibold")}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Channel filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-muted)]"
          >
            {activeChannel ? (
              <>
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
                  style={{ backgroundColor: activeChannel.color || "#6366f1" }}
                />
                <span className="truncate">{activeChannel.name}</span>
              </>
            ) : (
              <>
                <Icon name="Funnel" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <span>All apps</span>
              </>
            )}
            <Icon name="CaretDown" className="h-3 w-3 text-[var(--color-text-subtle)]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
          <DropdownMenuItem
            onSelect={() => setParam("app", null)}
            className={cn(!activeChannel && "font-semibold")}
          >
            All apps
          </DropdownMenuItem>
          {apps.length > 0 && <DropdownMenuSeparator />}
          {apps.map((a) => (
            <DropdownMenuItem
              key={a.id}
              onSelect={() => setParam("app", a.id)}
              className={cn(
                "gap-2",
                activeChannel?.id === a.id && "font-semibold",
              )}
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
                style={{ backgroundColor: a.color || "#6366f1" }}
              />
              {a.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <form onSubmit={onSearch} className="ml-auto hidden md:block">
        <div className="flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 focus-within:border-[var(--indigo-500)]">
          <Icon name="MagnifyingGlass" className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts and drafts"
            className="w-56 bg-transparent text-sm placeholder:text-[var(--color-text-subtle)] focus:outline-none"
          />
        </div>
      </form>

      {/* New post quick action */}
      <Button asChild size="sm" className="ml-auto md:ml-0">
        <Link href="/compose" className="gap-1">
          <Icon name="Plus" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New post</span>
          <span className="sm:hidden">New</span>
        </Link>
      </Button>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
          >
            <Icon name="Bell" className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Notifications
          </DropdownMenuLabel>
          <DropdownMenuItem disabled className="block whitespace-normal py-3 text-xs text-[var(--color-text-muted)]">
            You&apos;re running in hand-off mode, so we don&apos;t fetch
            replies or mentions yet. Connect a paid API in{" "}
            <span className="font-semibold text-[var(--color-text)]">
              Connections
            </span>{" "}
            to enable inbox alerts.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--indigo-50)] text-xs font-semibold text-[var(--indigo-700)] hover:bg-[var(--indigo-100)]"
          >
            S
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuLabel className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
            Account
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/connections">Connections</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" className="gap-2">
              <Icon name="House" className="h-3.5 w-3.5" />
              Marketing home
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <form action={signOutAction} className="block">
              <button
                type="submit"
                className="flex w-full items-center gap-2 text-left text-[var(--pink-600)] focus:text-[var(--pink-700)]"
              >
                <Icon name="ArrowRight" className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
