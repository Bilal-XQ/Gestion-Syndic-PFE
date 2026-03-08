import { z } from "zod";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),
  password: z
    .string()
    .min(1, "Le mot de passe est requis"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Request password reset (email only)
// ---------------------------------------------------------------------------
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse e-mail est requise")
    .email("Adresse e-mail invalide"),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Set new password (password recovery flow)
// ---------------------------------------------------------------------------
export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z
      .string()
      .min(1, "Veuillez confirmer le mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;
