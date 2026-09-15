import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { firstError } from "@/lib/validation";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) return fail(firstError(error), 422);
  console.error("[api]", error);
  return fail("Se ha producido un error inesperado.", 500);
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: `Demasiados intentos. Inténtalo de nuevo en ${retryAfterSeconds} segundos.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
