import { getTranslations } from "next-intl/server";
import { ProfileView } from "@/components/features/portal/profile-view";

export default async function PortalPage() {
  const t = await getTranslations("portal");
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <ProfileView />
    </div>
  );
}
