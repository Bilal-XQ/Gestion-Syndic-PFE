import { z } from "zod";

export function createUpdatePhoneSchema(t: (key: string) => string) {
  return z.object({
    phone: z
      .string()
      .min(8, t("profile.phoneMin"))
      .max(20, t("profile.phoneMax"))
      .optional()
      .or(z.literal("")),
  });
}

export type UpdatePhoneFormValues = z.infer<ReturnType<typeof createUpdatePhoneSchema>>;

export function createChangePasswordSchema(t: (key: string) => string) {
  return z
    .object({
      password: z.string().min(8, t("profile.passwordMin8")),
      confirmPassword: z.string().min(8, t("profile.passwordMin8")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("profile.passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type ChangePasswordFormValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;
