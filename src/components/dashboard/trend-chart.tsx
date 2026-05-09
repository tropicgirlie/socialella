import { format, parseISO } from "date-fns";

export type TrendPoint = { date: string; value: number };

/**
 * Server-rendered SVG line+area chart. No JS bundle cost.
 * Decision-first: prominent total, subtle gridlines, clear last-value marker.
 */
export function TrendChart({
  data,
  height = 200,
}: {
  data: TrendPoint[];
  height?: number;
}) {
  const w = 800;
  const h = height;
  const padX = 28;
  const padY = 24;

  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  function pointAt(i: number, v: number) {
    const x = padX + i * stepX;
    const y = padY + (innerH - (v / max) * innerH);
    return { x, y };
  }

  const points = data.map((d, i) => pointAt(i, d.value));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${h - padY} L ${points[0].x.toFixed(1)} ${h - padY} Z`
      : "";

  // Gridline values (4 horizontal lines including 0)
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((max / yTicks) * i),
  );

  // X labels — show first, ~middle, last
  const xLabels =
    data.length > 1
      ? [
          { i: 0, label: format(parseISO(data[0].date), "MMM d") },
          {
            i: Math.floor(data.length / 2),
            label: format(parseISO(data[Math.floor(data.length / 2)].date), "MMM d"),
          },
          {
            i: data.length - 1,
            label: format(parseISO(data[data.length - 1].date), "MMM d"),
          },
        ]
      : [];

  const last = data.length > 0 ? data[data.length - 1] : null;
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[28px] font-semibold leading-none tracking-tight text-[var(--color-text)]">
            {total}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Total in period
          </p>
        </div>
        {last && (
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--color-text)]">
              {last.value} today
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {format(parseISO(last.date), "EEE, MMM d")}
            </p>
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          className="h-[200px] w-full"
          role="img"
          aria-label={`Posts shipped over time, ${total} total`}
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--indigo-500)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--indigo-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {tickValues.map((v, i) => {
            const y = padY + innerH - (v / max) * innerH;
            return (
              <g key={i}>
                <line
                  x1={padX}
                  x2={w - padX}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? "0" : "2 4"}
                />
                <text
                  x={padX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-text-subtle)"
                  className="tabular-nums"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* Area + line */}
          {data.length > 0 && (
            <>
              <path d={areaPath} fill="url(#trend-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke="var(--indigo-600)"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {lastPoint && (
                <>
                  <circle
                    cx={lastPoint.x}
                    cy={lastPoint.y}
                    r={4}
                    fill="white"
                    stroke="var(--indigo-600)"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </>
          )}

          {/* X labels */}
          {xLabels.map((l) => (
            <text
              key={l.i}
              x={padX + l.i * stepX}
              y={h - 4}
              textAnchor={
                l.i === 0
                  ? "start"
                  : l.i === data.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize="10"
              fill="var(--color-text-subtle)"
            >
              {l.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
