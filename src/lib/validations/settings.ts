import { z } from "zod";

export const settingsSchema = z.object({
  name: z.string().min(1, "Le nom de l'immeuble est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  contactPhone: z.string().optional(),
  contactEmail: z
    .string()
    .email("Adresse e-mail invalide")
    .optional()
    .or(z.literal("")),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
