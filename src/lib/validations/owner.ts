import { z } from "zod";

export function createOwnerSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, t("owner.firstNameRequired")),
    lastName: z.string().min(1, t("owner.lastNameRequired")),
    email: z.string().email(t("owner.emailInvalid")),
    phone: z.string().optional(),
    apartmentId: z.string().uuid(t("owner.apartmentInvalid")),
    ownershipDate: z.string().date(t("owner.dateInvalid")),
  });
}

export type OwnerFormValues = z.infer<ReturnType<typeof createOwnerSchema>>;
