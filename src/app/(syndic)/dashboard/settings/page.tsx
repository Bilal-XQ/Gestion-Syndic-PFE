import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getAllBuildingsBySyndicId } from "@/lib/db/queries/buildings";
import { SettingsForm } from "@/components/features/settings/settings-form";

type SettingsSearchParams = {
  buildingId?: string;
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<SettingsSearchParams> | SettingsSearchParams;
}) {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        <h1 className="text-2xl font-semibold text-[--text-primary]">
          {t("pageTitle")}
        </h1>
        <p className="text-sm text-[--text-muted]">{t("unauthenticated")}</p>
      </div>
    );
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const allBuildings = await getAllBuildingsBySyndicId(user.id);

  const selectedBuilding =
    allBuildings.find((b) => b.id === resolvedSearchParams.buildingId) ??
    allBuildings[0];

  if (!selectedBuilding) {
    redirect("/dashboard");
  }

  // Fetch syndic user for contact info
  const [syndicUser] = await db
    .select({ phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.id, user.id));

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitleAuthenticated")}
      </h1>
      <SettingsForm
        allBuildings={allBuildings.map((b) => ({ id: b.id, name: b.name }))}
        selectedBuildingId={selectedBuilding.id}
        defaultValues={{
          buildingId: selectedBuilding.id,
          name: selectedBuilding.name,
          address: selectedBuilding.address,
          contactPhone: syndicUser?.phone ?? "",
          contactEmail: syndicUser?.email ?? "",
        }}
      />
    </div>
  );
}
