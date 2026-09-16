"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const NEXT_STATUS: Record<string, { label: string; value: string }[]> = {
  PENDING: [
    { label: "Marcar revisado", value: "REVIEWED" },
    { label: "Resolver", value: "RESOLVED" },
  ],
  REVIEWED: [
    { label: "Resolver", value: "RESOLVED" },
    { label: "Volver a pendiente", value: "PENDING" },
  ],
  RESOLVED: [{ label: "Reabrir", value: "PENDING" }],
};

export function ReportActions({ reportId, status }: { reportId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function update(next: string) {
    setBusy(true);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {(NEXT_STATUS[status] ?? []).map((action) => (
        <button
          key={action.value}
          type="button"
          onClick={() => update(action.value)}
          disabled={busy}
          className="focus-ring rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold text-ink-muted transition-colors hover:border-lip/40 hover:text-ink disabled:opacity-40"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
