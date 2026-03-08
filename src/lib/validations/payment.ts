import { z } from "zod";

export const paymentSchema = z.object({
  chargeId: z.string().uuid("Charge invalide"),
  ownerId: z.string().uuid("Propriétaire invalide"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  paymentDate: z.string().min(1, "La date de paiement est requise"),
  method: z.enum(["bank_transfer", "check", "cash"], {
    message: "Méthode de paiement invalide",
  }),
  reference: z.string().min(1, "La référence est requise"),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;
