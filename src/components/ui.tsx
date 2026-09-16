import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ------------------------------ Botones ------------------------------ */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-lip text-ink hover:bg-lip-soft hover:text-noir",
  secondary: "bg-raised text-ink border border-line hover:border-lip",
  outline: "border border-line text-ink hover:border-lip hover:text-lip-soft",
  ghost: "text-ink-muted hover:text-ink",
  danger: "border border-danger/40 text-danger hover:bg-danger hover:text-ink",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[12px]",
  md: "h-11 px-6 text-[13px]",
  lg: "h-[54px] px-8 text-[14px]",
};

/**
 * Botón de cartel: rectángulo con esquina mínima, texto en versalitas muy
 * espaciadas. La píldora con la flecha en su propio círculo se ha retirado;
 * era un adorno repetido en cada llamada a la acción.
 */
function buttonClass(variant: Variant, size: Size, full?: boolean) {
  return [
    "inline-flex items-center justify-center gap-2.5 rounded-[3px]",
    "font-semibold uppercase tracking-[0.13em] leading-none",
    "transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)] active:translate-y-px focus-ring",
    "disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    full ? "w-full" : "",
  ].join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  icon: _icon,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  /** Se mantiene por compatibilidad; ya no dibuja nada. */
  icon?: boolean;
}) {
  return (
    <button className={`${buttonClass(variant, size, full)} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full,
  icon: _icon,
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  /** Se mantiene por compatibilidad; ya no dibuja nada. */
  icon?: boolean;
}) {
  return (
    <Link className={`${buttonClass(variant, size, full)} ${className}`} {...props}>
      {children}
    </Link>
  );
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
      className={`inline-flex items-center rounded-[2px] px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] ${
        premium ? "bg-lip text-ink" : "bg-ink/90 text-noir"
      } ${className}`}
    >
      {premium ? "Premium" : "Básico"}
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  positive: "border-positive/30 bg-positive/10 text-positive",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  neutral: "border-white/10 bg-white/[0.04] text-ink-muted",
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
      className={`inline-flex items-center rounded-[2px] border px-2.5 py-1 text-[11px] font-medium ${STATUS_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Píldora microscópica que precede a los titulares. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow inline-flex items-center gap-3">
      <span className="h-px w-8 bg-lip" aria-hidden />
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
  title: ReactNode;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-5">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
        )}
        <h2 className="display-lg text-ink">{title}</h2>
        {description && (
          <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-ink-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Tarjeta con carcasa exterior y núcleo interior: radios concéntricos y
 * reflejo interno, en lugar de un rectángulo plano con borde gris.
 */
export function Card({
  children,
  className = "",
  compact,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={`panel-line ${compact ? "p-5" : "p-6 sm:p-8"} ${className}`}>
      {children}
    </Tag>
  );
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
    <Card>
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        {icon && <div className="text-ink-faint">{icon}</div>}
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        {description && (
          <p className="max-w-sm text-[14px] leading-relaxed text-ink-muted">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </Card>
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
        className="block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint"
      >
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] leading-relaxed text-ink-faint">{hint}</p>}
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-[3px] border border-line bg-noir px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-faint " +
  "transition-colors duration-300 ease-[cubic-bezier(.22,1,.36,1)] " +
  "focus:border-lip focus:outline-none";

export function Alert({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "positive" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-line bg-raised text-ink-muted",
    positive: "border-positive/25 bg-positive/[0.08] text-positive",
    warning: "border-warning/25 bg-warning/[0.08] text-warning",
    danger: "border-danger/25 bg-danger/[0.08] text-danger",
  };
  return (
    <div className={`rounded-[3px] border px-4 py-3.5 text-[13.5px] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}
