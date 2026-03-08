import { NotificationsList } from "@/components/features/notifications/notifications-list";

export default function NotificationsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Notifications
      </h1>
      <NotificationsList />
    </div>
  );
}
