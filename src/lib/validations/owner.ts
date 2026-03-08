import { z } from "zod";

export const ownerSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().optional(),
  apartmentId: z.string().uuid("Appartement invalide"),
  ownershipDate: z.string().date("Date invalide"),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;
