import { z } from "zod";

export const apartmentSchema = z.object({
  unitNumber: z.string().min(1, "Le numéro est requis"),
  floor: z.coerce.number().int("L'étage doit être un entier"),
  surfaceArea: z.coerce.number().positive("La superficie doit être positive"),
  roomCount: z.coerce
    .number()
    .int("Le nombre de pièces doit être un entier")
    .min(1, "Au moins 1 pièce"),
});

export type ApartmentFormValues = z.infer<typeof apartmentSchema>;
