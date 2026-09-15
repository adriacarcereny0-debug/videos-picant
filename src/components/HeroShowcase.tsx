import { IconLock, IconPlay } from "@/components/icons";

/**
 * Composición decorativa del hero (solo escritorio).
 * Ilustra el contraste entre contenido desbloqueado y bloqueado sin usar
 * imágenes reales del catálogo.
 */
export function HeroShowcase() {
  return (
    <div className="relative hidden h-[460px] lg:block" aria-hidden>
      {/* Tarjeta trasera */}
      <div className="absolute right-10 top-4 w-[300px] rotate-[6deg] rounded-2xl border border-line bg-gradient-to-br from-[#191924] to-[#101016] p-3 opacity-55 shadow-2xl">
        <div className="aspect-video rounded-xl bg-gradient-to-br from-[#2a2438] to-[#14141b]" />
      </div>

      {/* Tarjeta media — bloqueada */}
      <div className="absolute right-0 top-24 w-[330px] rotate-[-4deg] rounded-2xl border border-line bg-[#101014] p-3 shadow-2xl">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-[#2b2230] to-[#121218]">
          <div className="absolute inset-0 backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-aurum/35 bg-obsidian/70 text-aurum">
              <IconLock width={17} height={17} />
            </span>
            <span className="text-[11px] font-semibold text-ink-muted">Requiere plan Premium</span>
          </div>
          <span className="absolute left-2.5 top-2.5 rounded-full border border-aurum/45 bg-aurum/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-aurum-soft">
            Premium
          </span>
        </div>
      </div>

      {/* Tarjeta frontal — desbloqueada */}
      <div className="absolute right-24 top-[248px] w-[300px] rotate-[3deg] rounded-2xl border border-aurum/25 bg-[#12121a] p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-[#3a3350] via-[#242036] to-[#15151d]">
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-obsidian/55 text-ink backdrop-blur-md">
              <IconPlay width={19} height={19} />
            </span>
          </div>
          <span className="absolute left-2.5 top-2.5 rounded-full border border-silver/30 bg-silver/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-silver">
            Básico
          </span>
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-obsidian/75 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-ink">
            12:22
          </span>
        </div>
        <div className="px-1 pb-1 pt-3">
          <div className="h-2.5 w-2/3 rounded-full bg-white/12" />
          <div className="mt-2 h-2 w-1/3 rounded-full bg-white/6" />
        </div>
      </div>
    </div>
  );
}
