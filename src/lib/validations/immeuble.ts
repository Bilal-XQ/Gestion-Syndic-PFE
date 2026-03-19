import { z } from "zod";

type TranslationFn = (key: string) => string;

export function createImmeubleSchema(t: TranslationFn) {
  return z.object({
    name: z.string().min(1, t("immeuble.nameRequired")),
    address: z.string().min(1, t("immeuble.addressRequired")),
    totalTantiemes: z.coerce
      .number()
      .int()
      .min(1, t("immeuble.totalTantièmesMin")),
  });
}

export type ImmeubleFormValues = z.infer<
  ReturnType<typeof createImmeubleSchema>
>;
