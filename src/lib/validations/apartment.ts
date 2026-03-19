import { z } from "zod";

export function createApartmentSchema(t: (key: string) => string) {
  return z.object({
    buildingId: z.string().uuid(t("apartment.buildingRequired")),
    unitNumber: z.string().min(1, t("apartment.unitNumberRequired")),
    floor: z.coerce.number().int(t("apartment.floorInteger")),
    surfaceArea: z.coerce.number().positive(t("apartment.surfacePositive")),
    roomCount: z.coerce
      .number()
      .int(t("apartment.roomCountInteger"))
      .min(1, t("apartment.roomCountMin")),
    tantiemes: z.coerce
      .number()
      .int(t("apartment.tantiemesInteger"))
      .min(1, t("apartment.tantiemesMin")),
    type: z.enum(["studio", "t1", "t2", "t3", "t4_plus"], {
      error: t("apartment.typeRequired"),
    }),
  });
}

export type ApartmentFormValues = z.infer<ReturnType<typeof createApartmentSchema>>;
