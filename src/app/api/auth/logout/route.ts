import { NextResponse } from "next/server";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { logSecurityEvent } from "@/lib/security";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await logSecurityEvent("LOGOUT", { userId: user.id, email: user.email });
  return NextResponse.redirect(new URL("/", env.appUrl), { status: 303 });
}
