"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserActions({
  userId,
  suspended,
  isAdmin,
}: {
  userId: string;
  suspended: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (isAdmin) {
    return <span className="text-[12px] text-ink-faint">—</span>;
  }

  async function run() {
    if (!suspended && !window.confirm("¿Suspender esta cuenta? Se cerrarán sus sesiones.")) return;
    setBusy(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: suspended ? "reactivate" : "suspend" }),
    }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={`focus-ring rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
        suspended
          ? "border-positive/35 text-positive hover:bg-positive/10"
          : "border-line text-ink-muted hover:border-danger/40 hover:text-danger"
      }`}
    >
      {busy ? "…" : suspended ? "Reactivar" : "Suspender"}
    </button>
  );
}
