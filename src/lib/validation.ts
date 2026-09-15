import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres.")
  .max(128, "La contraseña es demasiado larga.")
  .regex(/[a-z]/, "Debe incluir al menos una minúscula.")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula.")
  .regex(/[0-9]/, "Debe incluir al menos un número.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Introduce un correo electrónico válido.")
  .max(180);

export const registerSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().max(40).optional().or(z.literal("")),
    password: passwordSchema,
    passwordConfirm: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los términos y condiciones." }),
    }),
    confirmAge: z.literal(true, {
      errorMap: () => ({ message: "Debes confirmar que eres mayor de 18 años." }),
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Las contraseñas no coinciden.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introduce tu contraseña."),
  remember: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});

export const profileSchema = z.object({
  displayName: z.string().trim().max(40).optional().or(z.literal("")),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
});

export const reportSchema = z.object({
  videoId: z.string().min(1).optional().nullable(),
  reason: z.enum(["INAPPROPRIATE", "TECHNICAL", "UNAUTHORIZED", "OTHER"]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  contactEmail: emailSchema.optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const checkoutSchema = z.object({ plan: z.enum(["BASIC", "PREMIUM"]) });

export const videoSchema = z.object({
  title: z.string().trim().min(3, "El título es obligatorio.").max(140),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().max(60).default("General"),
  subscriptionLevel: z.enum(["BASIC", "PREMIUM"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  durationSeconds: z.coerce.number().int().min(0).max(86400).default(0),
  publishedAt: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

/** Primer mensaje de error legible de un ZodError. */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos no válidos.";
}
