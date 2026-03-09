import { getTranslations } from "next-intl/server";
import { MeetingsTable } from "@/components/features/meetings/meetings-table";

export default async function MeetingsPage() {
  const t = await getTranslations("meetings");
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <MeetingsTable />
    </div>
  );
}
