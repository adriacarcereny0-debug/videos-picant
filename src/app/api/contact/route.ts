import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { handleError, ok, tooManyRequests } from "@/lib/api";
import { rateLimit, requestContext } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { ip } = await requestContext();
    const limit = rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const payload = contactSchema.parse(await request.json());
    await prisma.contactMessage.create({ data: payload });

    return ok({ success: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
