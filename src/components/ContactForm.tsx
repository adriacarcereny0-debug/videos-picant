"use client";

import { useState } from "react";
import { Alert, Button, Field, inputClass } from "@/components/ui";

export function ContactForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setState("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "No se ha podido enviar el mensaje.");
      setState("sent");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <Alert tone="positive">
        Hemos recibido tu mensaje. Te responderemos en un plazo máximo de 48 horas hábiles.
      </Alert>
    );
  }

  return (
    <form action={submit} className="space-y-5">
      {state === "error" && <Alert tone="danger">{message}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="name">
          <input id="name" name="name" required maxLength={80} className={inputClass} />
        </Field>
        <Field label="Correo electrónico" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Asunto" htmlFor="subject">
        <input id="subject" name="subject" required maxLength={120} className={inputClass} />
      </Field>

      <Field label="Mensaje" htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={2000}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Button type="submit" size="lg" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </form>
  );
}
