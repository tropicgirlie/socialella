import Link from "next/link";

export type ChannelBar = {
  id: string;
  name: string;
  color: string;
  value: number;
};

/**
 * Compact horizontal bar list. Shipped count per app, sorted desc.
 */
export function ChannelBars({ data }: { data: ChannelBar[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <li key={d.id} className="text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/queue?app=${d.id}`}
                className="flex min-w-0 items-center gap-2 truncate hover:underline"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full ring-1 ring-inset ring-black/5"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate font-medium text-[var(--color-text)]">
                  {d.name}
                </span>
              </Link>
              <span className="shrink-0 text-xs tabular-nums text-[var(--color-text-muted)]">
                {d.value}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: d.color || "var(--indigo-500)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
