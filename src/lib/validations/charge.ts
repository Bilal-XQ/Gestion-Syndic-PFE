import { z } from "zod";

export function createChargeSchema(t: (key: string) => string) {
  const common = {
    title: z.string().min(1, t("charge.titleRequired")),
    description: z.string().optional(),
    category: z.enum(["electricity", "water", "maintenance", "repair", "other"], {
      message: t("charge.categoryInvalid"),
    }),
    totalAmount: z.coerce.number().positive(t("charge.amountPositive")),
    dueDate: z.string().min(1, t("charge.dueDateRequired")),
    buildingId: z.string().uuid(t("charge.buildingRequired")),
  };

  return z.discriminatedUnion("target", [
    z.object({
      ...common,
      target: z.literal("apartment"),
      apartmentId: z.string().uuid(t("charge.apartmentRequired")),
    }),
    z.object({
      ...common,
      target: z.literal("building"),
      apartmentId: z.string().optional(),
    }),
  ]);
}

export type ChargeFormValues = z.infer<ReturnType<typeof createChargeSchema>>;
