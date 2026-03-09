import { getTranslations } from "next-intl/server";
import { ChargesTable } from "@/components/features/charges/charges-table";

export default async function ChargesPage() {
  const t = await getTranslations("charges");
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <ChargesTable />
    </div>
  );
}
