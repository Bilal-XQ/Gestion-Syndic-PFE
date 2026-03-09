import { z } from "zod";

export function createPaymentSchema(t: (key: string) => string) {
  return z.object({
    chargeId: z.string().uuid(t("payment.chargeInvalid")),
    ownerId: z.string().uuid(t("payment.ownerInvalid")),
    amount: z.coerce.number().positive(t("payment.amountPositive")),
    paymentDate: z.string().min(1, t("payment.paymentDateRequired")),
    method: z.enum(["bank_transfer", "check", "cash"], {
      message: t("payment.methodInvalid"),
    }),
    reference: z.string().min(1, t("payment.referenceRequired")),
    notes: z.string().optional(),
  });
}

export type PaymentFormValues = z.infer<ReturnType<typeof createPaymentSchema>>;
