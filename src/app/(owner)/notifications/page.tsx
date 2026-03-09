import { getTranslations } from "next-intl/server";
import { NotificationsList } from "@/components/features/notifications/notifications-list";

export default async function NotificationsPage() {
  const t = await getTranslations("notifications");
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <NotificationsList />
    </div>
  );
}
