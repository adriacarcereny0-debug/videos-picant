import Link from "next/link";

/**
 * Marca Noctra: monograma en losange sobre trazo dorado.
 * Identidad propia, sin relación con ninguna referencia externa.
 */
export function Logo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const dimension = size === "sm" ? 26 : size === "lg" ? 40 : 32;
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  const mark = (
    <span className="flex items-center gap-2.5">
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="noctra-mark" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E0C493" />
            <stop offset="0.55" stopColor="#C8A063" />
            <stop offset="1" stopColor="#8E6F3C" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          stroke="url(#noctra-mark)"
          strokeWidth="1.4"
          opacity="0.75"
        />
        <path
          d="M13 27.5V12.5L27 27.5V12.5"
          stroke="url(#noctra-mark)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-display font-extrabold tracking-[-0.04em] text-ink ${text} leading-none`}
      >
        noctra
        <span className="text-aurum">.</span>
      </span>
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="focus-ring" aria-label="Noctra — inicio">
      {mark}
    </Link>
  );
}
