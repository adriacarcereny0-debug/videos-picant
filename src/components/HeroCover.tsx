"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LevelBadge } from "@/components/ui";

export interface Cover {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string;
  subscriptionLevel: "BASIC" | "PREMIUM";
}

const ROTATION_MS = 7500;

/**
 * Portada del hero.
 *
 * La imagen sale del vídeo marcado como destacado en /admin/videos. Si hay
 * varios, se encadenan con un fundido largo. La imagen es la miniatura
 * firmada —nunca el vídeo—, así que no expone contenido protegido.
 */
export function HeroCover({ covers }: { covers: Cover[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (covers.length < 2) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % covers.length),
      ROTATION_MS,
    );
    return () => clearInterval(timer);
  }, [covers.length]);

  if (covers.length === 0) return null;

  const active = covers[index];

  return (
    <>
      {/* Capa de imagen: fundido cruzado + deriva lentísima */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        {covers.map((cover, position) => (
          <div
            key={cover.id}
            className="absolute inset-0 transition-opacity duration-[2200ms] ease-[cubic-bezier(.32,.72,0,1)]"
            style={{ opacity: position === index ? 1 : 0 }}
          >
            <Image
              src={cover.thumbnailUrl}
              alt=""
              fill
              unoptimized
              priority={position === 0}
              sizes="100vw"
              className="drift object-cover"
              style={{ filter: "saturate(1.08) contrast(1.06)" }}
            />
          </div>
        ))}

        {/*
          Un único degradado direccional: opaco donde va el texto y casi
          limpio en el tercio derecho, para que la portada se lea como una
          fotografía. Apilar varias capas la aplastaba a negro.
        */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.13 0.013 20 / 0.97) 0%, oklch(0.13 0.013 20 / 0.92) 32%, oklch(0.13 0.013 20 / 0.58) 58%, oklch(0.13 0.013 20 / 0.15) 100%)",
          }}
        />
        {/* Remates: legibilidad de la isla arriba y empalme con la sección siguiente abajo */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-noir to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-noir to-transparent" />
      </div>

      {/* Ficha de la portada: filete y texto, sin caja */}
      <div className="pointer-events-none absolute right-5 top-[calc(var(--header-h)+40px)] z-20 hidden max-w-[280px] text-right sm:right-8 lg:block">
        <div className="pointer-events-auto border-r-2 border-lip pr-4">
          <p className="eyebrow mb-2 justify-end">En portada</p>
          <p className="font-display text-[22px] leading-none text-ink">{active.title}</p>
          <div className="mt-3 flex items-center justify-end gap-3">
            <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {active.category}
            </span>
            <LevelBadge level={active.subscriptionLevel} />
          </div>
        </div>

        {covers.length > 1 && (
          <div className="mt-4 flex justify-end gap-1.5">
            {covers.map((cover, position) => (
              <button
                key={cover.id}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Ver portada: ${cover.title}`}
                className={`pointer-events-auto h-[2px] transition-all duration-400 ease-[cubic-bezier(.22,1,.36,1)] ${
                  position === index ? "w-8 bg-lip" : "w-4 bg-ink/30 hover:bg-ink/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
