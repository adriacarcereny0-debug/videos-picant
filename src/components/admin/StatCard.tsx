import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: "neutral" | "aurum" | "silver" | "positive";
}) {
  const accents = {
    neutral: "text-ink-faint bg-white/5",
    aurum: "text-aurum bg-aurum/12",
    silver: "text-silver bg-silver/10",
    positive: "text-positive bg-positive/10",
  };

  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          {label}
        </p>
        {icon && (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${accents[accent]}`}>
            {icon}
          </span>
        )}
      </div>
      <p className="font-display mt-3 text-3xl font-extrabold tracking-[-0.04em] text-ink">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[12px] text-ink-faint">{hint}</p>}
    </div>
  );
}
