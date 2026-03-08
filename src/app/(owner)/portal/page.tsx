import { ProfileView } from "@/components/features/portal/profile-view";

export default function PortalPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Mon profil
      </h1>
      <ProfileView />
    </div>
  );
}
