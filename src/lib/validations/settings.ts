import { z } from "zod";

export function createSettingsSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("settings.buildingNameRequired")),
    address: z.string().min(1, t("settings.addressRequired")),
    contactPhone: z.string().optional(),
    contactEmail: z
      .string()
      .email(t("settings.emailInvalid"))
      .optional()
      .or(z.literal("")),
  });
}

export type SettingsFormValues = z.infer<ReturnType<typeof createSettingsSchema>>;
