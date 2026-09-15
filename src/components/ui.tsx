import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------ Botones ------------------------------ */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-aurum text-obsidian hover:bg-aurum-soft shadow-[0_10px_30px_-14px_rgba(200,160,99,.85)]",
  secondary: "bg-elevated text-ink border border-line hover:border-aurum/45 hover:bg-[#1c1c23]",
  outline: "border border-line text-ink hover:border-aurum/55 hover:text-aurum-soft",
  ghost: "text-ink-muted hover:text-ink hover:bg-white/5",
  danger: "bg-danger/12 text-danger border border-danger/30 hover:bg-danger/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px]",
};

function buttonClass(variant: Variant, size: Size, full?: boolean) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
    "transition-all duration-300 ease-[cubic-bezier(.22,.61,.36,1)] focus-ring",
    "disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    full ? "w-full" : "",
  ].join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <button className={`${buttonClass(variant, size, full)} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full,
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return <Link className={`${buttonClass(variant, size, full)} ${className}`} {...props} />;
}

/* ------------------------------ Etiquetas ---------------------------- */

export function LevelBadge({
  level,
  className = "",
}: {
  level: "BASIC" | "PREMIUM";
  className?: string;
}) {
  const premium = level === "PREMIUM";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md ${
        premium
          ? "border-aurum/45 bg-aurum/12 text-aurum-soft"
          : "border-silver/30 bg-silver/10 text-silver"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${premium ? "bg-aurum" : "bg-silver"}`}
        aria-hidden
      />
      {premium ? "Premium" : "Básico"}
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  positive: "border-positive/35 bg-positive/12 text-positive",
  warning: "border-warning/35 bg-warning/12 text-warning",
  danger: "border-danger/35 bg-danger/12 text-danger",
  neutral: "border-line bg-white/5 text-ink-muted",
};

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof STATUS_TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------ Bloques ------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="display-lg text-ink">{title}</h2>
        {description && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return <Tag className={`surface p-6 sm:p-7 ${className}`}>{children}</Tag>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-[13px] font-semibold tracking-wide text-ink-muted"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-[#0d0d11] px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint " +
  "transition-colors duration-200 focus:border-aurum/60 focus:outline-none focus:ring-2 focus:ring-aurum/20";

export function Alert({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "positive" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-line bg-white/[0.04] text-ink-muted",
    positive: "border-positive/30 bg-positive/10 text-positive",
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-danger/30 bg-danger/10 text-danger",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}
