"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconFullscreen,
  IconMute,
  IconPause,
  IconPlay,
  IconVolume,
} from "@/components/icons";
import { formatDuration } from "@/lib/format";

export interface PlayerSource {
  label: string;
  url: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Reproductor privado. Las URLs recibidas son temporales y firmadas en el
 * servidor; nunca corresponden a una ruta pública permanente.
 */
export function VideoPlayer({
  videoId,
  poster,
  sources,
  title,
}: {
  videoId: string;
  poster: string;
  sources: PlayerSource[];
  title: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reported = useRef(false);

  const [quality, setQuality] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);
  const [menu, setMenu] = useState<"none" | "speed" | "quality">("none");

  const activeSource = sources[quality] ?? sources[0];

  /* --------------------------- Controles --------------------------- */

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(0, el.currentTime + delta), el.duration || 0);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await shell.requestFullscreen().catch(() => undefined);
  }, []);

  const wake = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2800);
  }, []);

  /* ----------------------------- Efectos --------------------------- */

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      switch (event.key) {
        case " ":
        case "k":
          event.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          seekBy(5);
          break;
        case "ArrowLeft":
          seekBy(-5);
          break;
        case "f":
          void toggleFullscreen();
          break;
        case "m":
          setMuted((v) => !v);
          break;
        default:
          break;
      }
      wake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seekBy, toggleFullscreen, togglePlay, wake]);

  useEffect(() => {
    const el = videoRef.current;
    if (el) {
      el.volume = volume;
      el.muted = muted;
      el.playbackRate = rate;
    }
  }, [volume, muted, rate]);

  /** Cambio de calidad conservando la posición. */
  const changeQuality = (index: number) => {
    const el = videoRef.current;
    const at = el?.currentTime ?? 0;
    const wasPlaying = Boolean(el && !el.paused);
    setQuality(index);
    setMenu("none");
    requestAnimationFrame(() => {
      const next = videoRef.current;
      if (!next) return;
      next.currentTime = at;
      if (wasPlaying) void next.play();
    });
  };

  /** Registro de visualización (una vez por sesión de reproducción). */
  const reportView = useCallback(
    (seconds: number) => {
      if (reported.current) return;
      reported.current = true;
      void fetch(`/api/videos/${videoId}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchedSeconds: Math.round(seconds) }),
        keepalive: true,
      }).catch(() => undefined);
    },
    [videoId],
  );

  useEffect(() => {
    const handler = () => reportView(videoRef.current?.currentTime ?? 0);
    window.addEventListener("pagehide", handler);
    return () => {
      window.removeEventListener("pagehide", handler);
      handler();
    };
  }, [reportView]);

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={shellRef}
      onMouseMove={wake}
      onTouchStart={wake}
      onMouseLeave={() => playing && setIdle(true)}
      className={`group relative overflow-hidden rounded-2xl border border-line bg-black ${
        idle && playing ? "player-idle cursor-none" : ""
      }`}
    >
      <video
        ref={videoRef}
        key={activeSource?.url}
        poster={poster}
        playsInline
        preload="metadata"
        controlsList="nodownload"
        disablePictureInPicture={false}
        onContextMenu={(e) => e.preventDefault()}
        className="aspect-video w-full bg-black"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          setReady(true);
        }}
        onTimeUpdate={(e) => {
          setCurrent(e.currentTarget.currentTime);
          if (e.currentTarget.currentTime > 5) reportView(e.currentTarget.currentTime);
        }}
        onProgress={(e) => {
          const b = e.currentTarget.buffered;
          if (b.length) setBuffered(b.end(b.length - 1));
        }}
        onEnded={() => setPlaying(false)}
      >
        <source src={activeSource?.url} type="video/mp4" />
        Tu navegador no admite la reproducción de vídeo HTML5.
      </video>

      {/* Capa de play central */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={`Reproducir ${title}`}
          className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/55 via-black/10 to-black/25 transition-opacity"
        >
          <span className="grid h-[72px] w-[72px] place-items-center rounded-full border border-white/25 bg-black/55 text-ink backdrop-blur-md transition-transform duration-300 hover:scale-105">
            <IconPlay width={28} height={28} />
          </span>
        </button>
      )}

      {/* Barra de controles */}
      <div className="player-chrome absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/55 to-transparent px-3 pb-3 pt-10 sm:px-4 sm:pb-4">
        <div className="relative mb-2.5">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/18">
            <div className="h-full bg-white/25" style={{ width: `${bufferedPct}%` }} />
            <div
              className="absolute inset-y-0 left-0 bg-aurum"
              style={{ width: `${progress}%` }}
            />
          </div>
          <input
            type="range"
            className="player-range relative w-full"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            disabled={!ready}
            aria-label="Progreso"
            onChange={(e) => {
              const el = videoRef.current;
              if (el) el.currentTime = Number(e.target.value);
              setCurrent(Number(e.target.value));
            }}
            style={{ ["--track" as string]: "transparent" }}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-white/10"
            aria-label={playing ? "Pausa" : "Reproducir"}
          >
            {playing ? <IconPause /> : <IconPlay />}
          </button>

          <div className="group/vol flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMuted((v) => !v)}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-white/10"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
            >
              {muted || volume === 0 ? <IconMute /> : <IconVolume />}
            </button>
            <input
              type="range"
              className="player-range hidden w-20 sm:block"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volumen"
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(Number(e.target.value) === 0);
              }}
            />
          </div>

          <span className="ml-1 text-[12px] font-medium tabular-nums text-ink-muted">
            {formatDuration(current)} <span className="text-ink-faint">/ {formatDuration(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            {/* Velocidad */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu(menu === "speed" ? "none" : "speed")}
                className="focus-ring h-10 rounded-full px-3 text-[12px] font-bold text-ink transition-colors hover:bg-white/10"
                aria-label="Velocidad de reproducción"
              >
                {rate}×
              </button>
              {menu === "speed" && (
                <Menu>
                  {SPEEDS.map((value) => (
                    <MenuItem
                      key={value}
                      active={rate === value}
                      onClick={() => {
                        setRate(value);
                        setMenu("none");
                      }}
                    >
                      {value}×
                    </MenuItem>
                  ))}
                </Menu>
              )}
            </div>

            {/* Calidad */}
            {sources.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu(menu === "quality" ? "none" : "quality")}
                  className="focus-ring h-10 rounded-full px-3 text-[12px] font-bold text-ink transition-colors hover:bg-white/10"
                  aria-label="Calidad"
                >
                  {activeSource?.label}
                </button>
                {menu === "quality" && (
                  <Menu>
                    {sources.map((source, index) => (
                      <MenuItem
                        key={source.label}
                        active={index === quality}
                        onClick={() => changeQuality(index)}
                      >
                        {source.label}
                      </MenuItem>
                    ))}
                  </Menu>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-white/10"
              aria-label={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              <IconFullscreen />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-12 right-0 z-10 min-w-[104px] overflow-hidden rounded-xl border border-line bg-[#101014]/97 py-1.5 shadow-2xl backdrop-blur-xl">
      {children}
    </div>
  );
}

function MenuItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-white/6 ${
        active ? "font-bold text-aurum" : "text-ink-muted"
      }`}
    >
      {children}
      {active && <span className="text-aurum">•</span>}
    </button>
  );
}
