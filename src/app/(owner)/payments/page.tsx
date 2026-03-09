import { getTranslations } from "next-intl/server";
import { OwnerPaymentsView } from "@/components/features/payments/owner-payments-view";

export default async function OwnerPaymentsPage() {
  const t = await getTranslations("portal");
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("ownerPayments.pageTitle")}
      </h1>
      <OwnerPaymentsView />
    </div>
  );
}
