import { getTranslations } from "next-intl/server";
import { MeetingsView } from "@/components/features/portal/meetings-view";

export default async function OwnerMeetingsPage() {
  const t = await getTranslations("portal");

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("ownerMeetings.pageTitle")}
      </h1>
      <MeetingsView />
    </div>
  );
}
