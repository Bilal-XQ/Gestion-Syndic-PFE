import { z } from "zod";

export function createApartmentSchema(t: (key: string) => string) {
  return z.object({
    unitNumber: z.string().min(1, t("apartment.unitNumberRequired")),
    floor: z.coerce.number().int(t("apartment.floorInteger")),
    surfaceArea: z.coerce.number().positive(t("apartment.surfacePositive")),
    roomCount: z.coerce
      .number()
      .int(t("apartment.roomCountInteger"))
      .min(1, t("apartment.roomCountMin")),
  });
}

export type ApartmentFormValues = z.infer<ReturnType<typeof createApartmentSchema>>;
