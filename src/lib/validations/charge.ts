import { z } from "zod";

export function createChargeSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("charge.titleRequired")),
    description: z.string().optional(),
    category: z.enum(["electricity", "water", "maintenance", "repair", "other"], {
      message: t("charge.categoryInvalid"),
    }),
    totalAmount: z.coerce.number().positive(t("charge.amountPositive")),
    dueDate: z.string().min(1, t("charge.dueDateRequired")),
    apartmentId: z.string().uuid(t("charge.apartmentInvalid")),
  });
}

export type ChargeFormValues = z.infer<ReturnType<typeof createChargeSchema>>;
