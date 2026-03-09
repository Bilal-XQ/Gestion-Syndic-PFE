import { getTranslations } from "next-intl/server";
import { PaymentsTable } from "@/components/features/payments/payments-table";

export default async function PaymentsPage() {
  const t = await getTranslations("payments");
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <PaymentsTable />
    </div>
  );
}
