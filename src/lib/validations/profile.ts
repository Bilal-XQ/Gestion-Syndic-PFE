import { z } from "zod";

export const updatePhoneSchema = z.object({
  phone: z
    .string()
    .min(8, "Le numéro doit contenir au moins 8 caractères")
    .max(20, "Le numéro ne doit pas dépasser 20 caractères")
    .optional()
    .or(z.literal("")),
});

export type UpdatePhoneFormValues = z.infer<typeof updatePhoneSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum"),
    confirmPassword: z.string().min(8, "8 caractères minimum"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
