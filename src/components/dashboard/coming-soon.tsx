import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/Icon";

export function ComingSoon({
  icon,
  eyebrow,
  title,
  description,
  bullets,
  primaryHref = "/connections",
  primaryCta = "Open Connections",
  secondaryHref,
  secondaryCta,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primaryHref?: string;
  primaryCta?: string;
  secondaryHref?: string;
  secondaryCta?: string;
}) {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          {title}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">
          {description}
        </p>
      </header>

      <Card className="overflow-hidden">
        <CardContent className="grid items-center gap-6 p-8 sm:grid-cols-[auto_1fr_auto]">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-soft)] text-[var(--color-accent-soft-text)]">
            <Icon name={icon} className="h-5 w-5" weight="fill" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Available with auto-post upgrade
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Socialella runs in hand-off mode by default — that keeps things
              simple and free. Connect a paid platform API to unlock this view.
            </p>
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]"
                >
                  <span
                    aria-hidden
                    className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-subtle)]"
                  />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Button asChild size="sm">
              <Link href={primaryHref}>{primaryCta}</Link>
            </Button>
            {secondaryHref && secondaryCta && (
              <Button asChild size="sm" variant="outline">
                <Link href={secondaryHref}>{secondaryCta}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
