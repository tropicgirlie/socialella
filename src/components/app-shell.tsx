"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NAV = [
  { href: "/", label: "Dashboard", icon: "Sparkle" as const },
  { href: "/queue", label: "Queue", icon: "CalendarBlank" as const },
  { href: "/compose/batch", label: "Batch", icon: "ListBullets" as const },
  { href: "/compose", label: "Compose", icon: "ClipboardText" as const },
  { href: "/library", label: "Library", icon: "Tray" as const },
  { href: "/apps", label: "Apps", icon: "RocketLaunch" as const },
  { href: "/safety", label: "Safety", icon: "ShieldCheck" as const },
  { href: "/settings", label: "Settings", icon: "Lightning" as const },
];

function activeNavHref(pathname: string) {
  const matches = NAV.filter((n) =>
    n.href === "/"
      ? pathname === "/"
      : pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function Wordmark({ size = "default" }: { size?: "default" | "sm" }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        aria-hidden
        className={cn(
          "editorial-mark text-[var(--color-accent)] leading-none",
          size === "sm" ? "text-2xl" : "text-3xl",
        )}
      >
        S
      </span>
      <span
        className={cn(
          "font-display tracking-tight",
          size === "sm" ? "text-lg" : "text-xl",
        )}
        style={{ fontVariationSettings: '"SOFT" 60, "opsz" 144' }}
      >
        ocialella
      </span>
    </span>
  );
}

function NavLinks(props: {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const activeHref = activeNavHref(props.pathname);
  return (
    <nav
      className={cn(
        "flex gap-1",
        props.mobile ? "flex-col" : "flex-col lg:flex-row lg:items-center",
      )}
      aria-label="Main"
    >
      {NAV.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => props.onNavigate?.()}
            className={cn(
              "group flex min-h-11 items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose-500)]",
              active
                ? "bg-[var(--rose-50)] text-[var(--rose-700)] dark:bg-[var(--cream-800)] dark:text-[var(--rose-200)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              name={item.icon}
              className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                active && "text-[var(--color-accent)]",
              )}
              weight={active ? "fill" : "regular"}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="hidden border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] lg:block lg:w-60 lg:border-b-0 lg:border-r lg:min-h-screen lg:sticky lg:top-0 lg:self-start">
        <div className="flex h-16 items-center border-b border-[var(--color-border)] px-5">
          <Link
            href="/"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose-500)]"
          >
            <Wordmark />
          </Link>
        </div>
        <div className="p-3">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95 px-4 backdrop-blur lg:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open menu">
              <Icon name="SidebarSimple" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle asChild>
                <Wordmark size="sm" />
              </DialogTitle>
            </DialogHeader>
            <NavLinks
              mobile
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
        <Wordmark size="sm" />
        <ThemeToggle />
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="hidden h-16 items-center justify-end gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 lg:flex">
          <ThemeToggle />
          <Button
            variant="outline"
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
        <footer className="border-t border-[var(--color-border)] px-4 py-6 text-center text-xs text-[var(--color-text-muted)] lg:hidden">
          <Button
            variant="link"
            className="text-xs"
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </Button>
        </footer>
      </div>
    </div>
  );
}
