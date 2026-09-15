"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";

function useSafeNext(fallback = "/dashboard") {
  const params = useSearchParams();
  const next = params.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

/* ------------------------------- Login ------------------------------- */

export function LoginForm() {
  const router = useRouter();
  const next = useSafeNext();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          remember: formData.get("remember") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se ha podido iniciar sesión.");
      router.push(data.redirectTo ?? next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="display-md mb-2 text-ink">Iniciar sesión</h1>
      <p className="mb-8 text-sm text-ink-muted">Accede a tu cuenta para continuar.</p>

      <form action={submit} className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field label="Correo electrónico" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="tu@correo.com"
          />
        </Field>

        <Field label="Contraseña" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-muted">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded border-line bg-elevated accent-[#c8a063]"
            />
            Recordarme
          </label>
          <Link
            href="/forgot-password"
            className="focus-ring text-[13px] text-aurum hover:text-aurum-soft"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        ¿Todavía no tienes cuenta?{" "}
        <Link href="/register" className="font-semibold text-aurum hover:text-aurum-soft">
          Regístrate
        </Link>
      </p>
    </div>
  );
}

/* ------------------------------ Registro ----------------------------- */

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useSafeNext("/dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("passwordConfirm") ?? "");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          displayName: formData.get("displayName"),
          password,
          passwordConfirm: confirm,
          acceptTerms: formData.get("acceptTerms") === "on",
          confirmAge: formData.get("confirmAge") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se ha podido crear la cuenta.");

      const plan = params.get("plan");
      router.push(plan ? `/pricing?plan=${plan}` : next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="display-md mb-2 text-ink">Crear cuenta</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Regístrate para elegir tu suscripción y acceder al catálogo.
      </p>

      <form action={submit} className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}

        <Field label="Nombre para mostrar" htmlFor="displayName" hint="Opcional.">
          <input
            id="displayName"
            name="displayName"
            type="text"
            maxLength={40}
            autoComplete="nickname"
            className={inputClass}
            placeholder="Cómo quieres que te llamemos"
          />
        </Field>

        <Field label="Correo electrónico" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="tu@correo.com"
          />
        </Field>

        <Field
          label="Contraseña"
          htmlFor="password"
          hint="Mínimo 10 caracteres, con mayúscula, minúscula y número."
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={inputClass}
            placeholder="••••••••••"
          />
        </Field>

        <Field label="Repite la contraseña" htmlFor="passwordConfirm">
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={inputClass}
            placeholder="••••••••••"
          />
        </Field>

        <div className="space-y-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              name="confirmAge"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line bg-elevated accent-[#c8a063]"
            />
            Confirmo que soy mayor de 18 años.
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line bg-elevated accent-[#c8a063]"
            />
            <span>
              Acepto los{" "}
              <Link href="/terms" className="text-aurum underline underline-offset-2">
                términos y condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacy" className="text-aurum underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </span>
          </label>
        </div>

        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-aurum hover:text-aurum-soft">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}

/* ------------------------ Recuperar contraseña ----------------------- */

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.get("email") }),
    }).catch(() => undefined);
    // Respuesta siempre idéntica: no revelamos si el correo existe.
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div>
        <h1 className="display-md mb-3 text-ink">Revisa tu correo</h1>
        <Alert tone="positive">
          Si existe una cuenta asociada a esa dirección, te hemos enviado un enlace para
          restablecer la contraseña. El enlace caduca en 60 minutos.
        </Alert>
        <Link
          href="/login"
          className="mt-8 block text-center text-sm font-semibold text-aurum hover:text-aurum-soft"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display-md mb-2 text-ink">Recuperar contraseña</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Introduce tu correo y te enviaremos un enlace para crear una nueva contraseña.
      </p>

      <form action={submit} className="space-y-5">
        <Field label="Correo electrónico" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="tu@correo.com"
          />
        </Field>
        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? "Enviando…" : "Enviar enlace"}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-8 block text-center text-sm text-ink-muted hover:text-ink"
      >
        Volver
      </Link>
    </div>
  );
}

/* ------------------------ Nueva contraseña --------------------------- */

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    const password = String(formData.get("password") ?? "");
    if (password !== String(formData.get("passwordConfirm") ?? "")) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "El enlace no es válido o ha caducado.");
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div>
        <h1 className="display-md mb-3 text-ink">Contraseña actualizada</h1>
        <Alert tone="positive">
          Ya puedes iniciar sesión con tu nueva contraseña. Te redirigimos…
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <h1 className="display-md mb-2 text-ink">Nueva contraseña</h1>
      <p className="mb-8 text-sm text-ink-muted">
        Elige una contraseña nueva para tu cuenta. Se cerrarán todas las sesiones abiertas.
      </p>

      <form action={submit} className="space-y-5">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Nueva contraseña" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={inputClass}
          />
        </Field>
        <Field label="Repite la contraseña" htmlFor="passwordConfirm">
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={10}
            className={inputClass}
          />
        </Field>
        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
