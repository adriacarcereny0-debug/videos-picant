import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardAdmin } from "@/lib/admin";
import { handleError, ok } from "@/lib/api";

export const runtime = "nodejs";

const schema = z.object({
  siteName: z.string().trim().min(2).max(60),
  supportEmail: z.string().trim().email().max(180),
  heroHeadline: z.string().trim().max(160),
  announcement: z.string().trim().max(300).optional().or(z.literal("")),
  signedUrlTtlSeconds: z.coerce.number().int().min(60).max(86400),
});

export async function PUT(request: NextRequest) {
  try {
    const { user, response } = await guardAdmin();
    if (!user) return response!;

    const payload = schema.parse(await request.json());

    await prisma.setting.upsert({
      where: { key: "site" },
      create: { key: "site", value: payload },
      update: { value: payload },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
