import type { Metadata } from "next";
import { PlanGrid } from "@/components/PlanGrid";
import { getCurrentUser } from "@/lib/auth";
import { IconCheck, IconClose } from "@/components/icons";

export const metadata: Metadata = {
  title: "Suscripciones",
  description:
    "Dos planes mensuales: Básico por 9,99 €/mes y Premium por 19,99 €/mes. Sin permanencia y con cancelación inmediata.",
  alternates: { canonical: "/pricing" },
};

export const dynamic = "force-dynamic";

const COMPARISON: { feature: string; basic: boolean; premium: boolean }[] = [
  { feature: "Contenido Básico completo", basic: true, premium: true },
  { feature: "Contenido Premium exclusivo", basic: false, premium: true },
  { feature: "Acceso prioritario a nuevos vídeos", basic: false, premium: true },
  { feature: "Reproductor privado con enlaces firmados", basic: true, premium: true },
  { feature: "Móvil, tablet y ordenador", basic: true, premium: true },
  { feature: "Avisos de nuevas publicaciones", basic: true, premium: true },
  { feature: "Cancelación en cualquier momento", basic: true, premium: true },
];

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-4">Suscripciones</p>
        <h1 className="display-lg text-ink">Elige cómo quieres acceder</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-ink-muted">
          Dos planes mensuales con una diferencia clara: el Básico abre el contenido Básico, el
          Premium abre absolutamente todo el catálogo.
        </p>
      </div>

      <div className="mt-14">
        <PlanGrid currentPlan={user?.plan ?? "FREE"} authenticated={Boolean(user)} />
      </div>

      {/* Tabla comparativa */}
      <section className="mt-20">
        <h2 className="display-md mb-8 text-center text-ink">Comparativa</h2>
        <div className="surface overflow-hidden !p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-faint sm:px-7">
                  Incluye
                </th>
                <th className="w-24 px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-silver sm:w-36">
                  Básico
                </th>
                <th className="w-24 px-3 py-4 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-aurum sm:w-36">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-4 text-ink-muted sm:px-7">{row.feature}</td>
                  <td className="px-3 py-4 text-center">
                    {row.basic ? (
                      <IconCheck className="mx-auto text-silver" width={18} height={18} />
                    ) : (
                      <IconClose className="mx-auto text-ink-faint/50" width={16} height={16} />
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">
                    {row.premium ? (
                      <IconCheck className="mx-auto text-aurum" width={18} height={18} />
                    ) : (
                      <IconClose className="mx-auto text-ink-faint/50" width={16} height={16} />
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-white/[0.02]">
                <td className="px-5 py-5 font-semibold text-ink sm:px-7">Precio mensual</td>
                <td className="px-3 py-5 text-center font-display text-lg font-bold text-ink">
                  9,99 €
                </td>
                <td className="px-3 py-5 text-center font-display text-lg font-bold text-aurum">
                  19,99 €
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
