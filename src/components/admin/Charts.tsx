import type { ReactNode } from "react";

export interface Point {
  label: string;
  value: number;
}

/** Escala los valores al alto disponible dejando un margen superior. */
function scale(values: number[], height: number) {
  const max = Math.max(...values, 1);
  return (value: number) => height - (value / max) * (height * 0.82) - height * 0.08;
}

function path(points: Point[], width: number, height: number, smooth = true): string {
  const y = scale(points.map((p) => p.value), height);
  const step = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((point, index) => {
      const x = index * step;
      const py = y(point.value);
      if (index === 0) return `M ${x} ${py}`;
      if (!smooth) return `L ${x} ${py}`;
      const prevX = (index - 1) * step;
      const prevY = y(points[index - 1].value);
      const cx = (prevX + x) / 2;
      return `C ${cx} ${prevY}, ${cx} ${py}, ${x} ${py}`;
    })
    .join(" ");
}

/** Gráfico de área: evolución temporal. */
export function AreaChart({
  points,
  accent = "#c8a063",
  height = 180,
  format = (n: number) => String(n),
}: {
  points: Point[];
  accent?: string;
  height?: number;
  format?: (value: number) => string;
}) {
  if (points.length === 0) return <ChartEmpty height={height} />;

  const width = 640;
  const id = accent.replace("#", "");
  const line = path(points, width, height);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const y = scale(points.map((p) => p.value), height);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-[180px] w-full"
        role="img"
        aria-label="Gráfico de evolución"
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="#232329"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill={`url(#fill-${id})`} />
        <path d={line} fill="none" stroke={accent} strokeWidth="2" vectorEffect="non-scaling-stroke" />

        {points.map((point, index) => (
          <circle
            key={point.label}
            cx={index * step}
            cy={y(point.value)}
            r="2.5"
            fill={accent}
            opacity={index === points.length - 1 ? 1 : 0.45}
          />
        ))}
      </svg>

      <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.12em] text-ink-faint">
        <span>{points[0]?.label}</span>
        <span className="text-ink-muted">máx. {format(max)}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Gráfico de barras: comparativa por periodo. */
export function BarChart({
  points,
  accent = "#aab4c4",
  height = 180,
}: {
  points: Point[];
  accent?: string;
  height?: number;
}) {
  if (points.length === 0) return <ChartEmpty height={height} />;

  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <div>
      <div className="flex h-[180px] items-end gap-1.5" style={{ height }}>
        {points.map((point) => (
          <div key={point.label} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] transition-all duration-500"
                style={{
                  height: `${Math.max((point.value / max) * 100, 2)}%`,
                  background: `linear-gradient(180deg, ${accent}, ${accent}55)`,
                }}
                title={`${point.label}: ${point.value}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.12em] text-ink-faint">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div
      className="grid place-items-center rounded-xl border border-dashed border-line text-[13px] text-ink-faint"
      style={{ height }}
    >
      Sin datos suficientes
    </div>
  );
}

export function ChartCard({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div className="surface p-6">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-faint">
          {title}
        </h3>
        {value && (
          <span className="font-display text-xl font-bold tracking-[-0.03em] text-ink">
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
