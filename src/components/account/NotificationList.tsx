"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { IconBell, IconCheck } from "@/components/icons";
import { relativeTime } from "@/lib/format";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationList({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const unread = items.filter((item) => !item.readAt).length;

  async function markAll() {
    setBusy(true);
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  async function markOne(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch(() => undefined);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">
          {unread > 0
            ? `${unread} ${unread === 1 ? "notificación sin leer" : "notificaciones sin leer"}`
            : "Estás al día."}
        </p>
        {unread > 0 && (
          <Button variant="ghost" size="sm" onClick={markAll} disabled={busy}>
            {busy ? "Marcando…" : "Marcar todas como leídas"}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="surface px-6 py-16 text-center">
          <IconBell className="mx-auto mb-3 text-ink-faint" width={28} height={28} />
          <p className="font-display text-lg font-bold text-ink">Sin notificaciones</p>
          <p className="mt-1.5 text-sm text-ink-muted">
            Aquí verás los avisos sobre tu cuenta, tu suscripción y las nuevas publicaciones.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => {
            const read = Boolean(item.readAt);
            const body = (
              <div className="flex gap-4">
                <span
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    read ? "bg-white/5 text-ink-faint" : "bg-lip/15 text-lip"
                  }`}
                >
                  <IconBell width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={`text-[15px] font-semibold ${read ? "text-ink-muted" : "text-ink"}`}
                    >
                      {item.title}
                    </p>
                    {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lip" />}
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">
                    {item.message}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-[11px] text-ink-faint">
                      {relativeTime(item.createdAt)}
                    </span>
                    {!read && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          void markOne(item.id);
                        }}
                        className="focus-ring inline-flex items-center gap-1 text-[11px] font-semibold text-ink-faint hover:text-lip"
                      >
                        <IconCheck width={13} height={13} />
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <li
                key={item.id}
                className={`surface px-5 py-4 transition-colors ${read ? "opacity-70" : ""}`}
              >
                {item.link ? (
                  <Link href={item.link} className="focus-ring block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
