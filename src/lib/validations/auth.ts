import { z } from "zod";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t("auth.emailRequired"))
      .email(t("auth.emailInvalid")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

// ---------------------------------------------------------------------------
// Request password reset (email only)
// ---------------------------------------------------------------------------
export function createResetPasswordSchema(t: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t("auth.emailRequired"))
      .email(t("auth.emailInvalid")),
  });
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;

// ---------------------------------------------------------------------------
// Set new password (password recovery flow)
// ---------------------------------------------------------------------------
export function createUpdatePasswordSchema(t: (key: string) => string) {
  return z
    .object({
      password: z.string().min(8, t("auth.passwordMin8")),
      confirmPassword: z.string().min(1, t("auth.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type UpdatePasswordFormValues = z.infer<ReturnType<typeof createUpdatePasswordSchema>>;
