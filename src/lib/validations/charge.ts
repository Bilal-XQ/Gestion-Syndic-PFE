import { z } from "zod";

export const chargeSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  category: z.enum(["electricity", "water", "maintenance", "repair", "other"], {
    message: "Catégorie invalide",
  }),
  totalAmount: z.coerce.number().positive("Le montant doit être positif"),
  dueDate: z.string().min(1, "La date d'échéance est requise"),
  apartmentId: z.string().uuid("Appartement invalide"),
});

export type ChargeFormValues = z.infer<typeof chargeSchema>;
