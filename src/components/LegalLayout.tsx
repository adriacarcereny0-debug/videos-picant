import type { ReactNode } from "react";

export function LegalLayout({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-14 sm:px-6 lg:py-20">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="display-lg text-ink">{title}</h1>
      <p className="mt-4 text-[13px] text-ink-faint">Última actualización: {updatedAt}</p>
      {intro && <p className="mt-6 text-[16px] leading-relaxed text-ink-muted">{intro}</p>}
      <div className="hairline my-10" />
      <div className="space-y-9">{children}</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-3 text-lg font-bold tracking-[-0.02em] text-ink">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted [&_a]:text-lip [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}
