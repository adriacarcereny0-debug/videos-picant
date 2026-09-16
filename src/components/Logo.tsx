import Link from "next/link";

/**
 * Marca Madrastras.
 *
 * Logotipo puramente tipográfico: la condensada de cartel en versalitas con
 * el punto final en carmín. Sin monograma ni símbolo: el nombre ya es la
 * imagen, y un icono más sería decoración.
 */
export function Logo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const scale =
    size === "sm" ? "text-[17px]" : size === "lg" ? "text-[30px]" : "text-[22px]";

  const mark = (
    <span
      className={`font-display leading-none tracking-[0.02em] text-ink ${scale}`}
    >
      Madrastras
      <span className="text-lip">.</span>
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} className="focus-ring" aria-label="Madrastras, inicio">
      {mark}
    </Link>
  );
}
