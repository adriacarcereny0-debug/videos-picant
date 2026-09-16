"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";

/** Entrada al panel: solo contraseña, sin correo. */
export function AdminGateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: formData.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se ha podido entrar.");

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="space-y-5">
      {error && <Alert tone="danger">{error}</Alert>}

      <Field label="Contraseña" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className={inputClass}
          placeholder="••••••••"
        />
      </Field>

      <Button type="submit" size="lg" full disabled={loading}>
        {loading ? "Entrando" : "Entrar"}
      </Button>

      <p className="text-[12px] leading-relaxed text-ink-faint">
        La sesión del panel dura 12 horas. Si tienes una cuenta con permisos de
        administrador, también puedes entrar desde el acceso normal.
      </p>
    </form>
  );
}
