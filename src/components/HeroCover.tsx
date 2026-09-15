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
              style={{ filter: "saturate(1.05) contrast(1.04)" }}
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
              "linear-gradient(90deg, rgba(5,5,6,0.97) 0%, rgba(5,5,6,0.9) 30%, rgba(5,5,6,0.55) 55%, rgba(5,5,6,0.12) 100%)",
          }}
        />
        {/* Remates: legibilidad de la isla arriba y empalme con la sección siguiente abajo */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-obsidian/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-obsidian to-transparent" />
      </div>

      {/* Ficha de la portada, abajo a la derecha */}
      <div className="pointer-events-none absolute bottom-8 right-4 z-20 hidden max-w-[260px] sm:right-8 lg:block">
        <div className="shell shell-sm pointer-events-auto backdrop-blur-xl">
          <div className="shell-core p-4">
            <p className="eyebrow mb-2.5">En portada</p>
            <p className="font-display mb-3 text-[19px] leading-tight text-ink">{active.title}</p>
            <div className="flex items-center justify-between gap-2">
              <LevelBadge level={active.subscriptionLevel} />
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {active.category}
              </span>
            </div>
          </div>
        </div>

        {covers.length > 1 && (
          <div className="mt-3 flex justify-end gap-1.5">
            {covers.map((cover, position) => (
              <button
                key={cover.id}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Ver portada: ${cover.title}`}
                className={`pointer-events-auto h-[3px] rounded-full transition-all duration-500 ease-[cubic-bezier(.32,.72,0,1)] ${
                  position === index ? "w-7 bg-aurum" : "w-3 bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
