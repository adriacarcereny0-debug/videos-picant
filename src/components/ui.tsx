import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { IconArrowUpRight } from "@/components/icons";

/* ------------------------------ Botones ------------------------------ */

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-aurum text-obsidian hover:bg-aurum-soft shadow-[0_18px_44px_-22px_rgba(200,160,99,.9)]",
  secondary:
    "bg-white/[0.045] text-ink border border-white/10 hover:bg-white/[0.08] hover:border-white/20",
  outline: "border border-white/12 text-ink hover:border-aurum/45 hover:text-aurum-soft",
  ghost: "text-ink-muted hover:text-ink hover:bg-white/[0.05]",
  danger: "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/18",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 pl-4 pr-4 text-[12.5px]",
  md: "h-11 pl-5 pr-5 text-[13.5px]",
  lg: "h-[52px] pl-7 pr-7 text-[15px]",
};

/** Con icono anidado el padding derecho se reduce para que quede a ras. */
const SIZES_WITH_ICON: Record<Size, string> = {
  sm: "h-9 pl-4 pr-1 text-[12.5px]",
  md: "h-11 pl-5 pr-1.5 text-[13.5px]",
  lg: "h-[52px] pl-7 pr-2 text-[15px]",
};

const ICON_WELL: Record<Size, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-9 w-9",
};

function buttonClass(variant: Variant, size: Size, full?: boolean, withIcon?: boolean) {
  return [
    "group/btn relative inline-flex items-center justify-center gap-3 rounded-full font-medium tracking-[-0.01em]",
    "transition-all duration-500 ease-[cubic-bezier(.32,.72,0,1)] active:scale-[0.985] focus-ring",
    "disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap",
    VARIANTS[variant],
    withIcon ? SIZES_WITH_ICON[size] : SIZES[size],
    full ? "w-full" : "",
  ].join(" ");
}

/**
 * Pozo circular que aloja la flecha. Nunca va suelta junto al texto:
 * se desplaza en diagonal al pasar el cursor, creando tensión interna.
 */
function IconWell({ size, variant }: { size: Size; variant: Variant }) {
  const tone =
    variant === "primary" ? "bg-obsidian/12 text-obsidian" : "bg-white/[0.08] text-ink";
  return (
    <span
      aria-hidden
      className={`ml-auto grid shrink-0 place-items-center rounded-full transition-transform duration-500 ease-[cubic-bezier(.32,.72,0,1)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-[1px] group-hover/btn:scale-105 ${ICON_WELL[size]} ${tone}`}
    >
      <IconArrowUpRight width={size === "sm" ? 12 : 14} height={size === "sm" ? 12 : 14} />
    </span>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  full,
  icon,
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: boolean;
}) {
  return (
    <button className={`${buttonClass(variant, size, full, icon)} ${className}`} {...props}>
      {children}
      {icon && <IconWell size={size} variant={variant} />}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  full,
  icon,
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  icon?: boolean;
}) {
  return (
    <Link className={`${buttonClass(variant, size, full, icon)} ${className}`} {...props}>
      {children}
      {icon && <IconWell size={size} variant={variant} />}
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.18em] backdrop-blur-md ${
        premium
          ? "border-aurum/40 bg-aurum/10 text-aurum-soft"
          : "border-silver/25 bg-silver/[0.07] text-silver"
      } ${className}`}
    >
      <span
        className={`h-1 w-1 rounded-full ${premium ? "bg-aurum" : "bg-silver"}`}
        aria-hidden
      />
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
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Píldora microscópica que precede a los titulares. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5">
      <span className="h-1 w-1 rounded-full bg-aurum" aria-hidden />
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
    <Tag className={`shell ${compact ? "shell-sm" : ""} ${className}`}>
      <div className="shell-core p-6 sm:p-8">{children}</div>
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
  "w-full rounded-2xl border border-white/[0.07] bg-black/40 px-4 py-3.5 text-[15px] text-ink placeholder:text-ink-faint " +
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] transition-all duration-400 ease-[cubic-bezier(.32,.72,0,1)] " +
  "focus:border-aurum/45 focus:outline-none focus:ring-[3px] focus:ring-aurum/12";

export function Alert({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "positive" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    neutral: "border-white/[0.07] bg-white/[0.03] text-ink-muted",
    positive: "border-positive/25 bg-positive/[0.08] text-positive",
    warning: "border-warning/25 bg-warning/[0.08] text-warning",
    danger: "border-danger/25 bg-danger/[0.08] text-danger",
  };
  return (
    <div className={`rounded-2xl border px-4 py-3.5 text-[13.5px] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}
