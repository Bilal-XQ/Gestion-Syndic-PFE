import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { getAllBuildingsBySyndicId } from "@/lib/db/queries/buildings";
import { getApartmentsEnriched } from "@/lib/db/queries/apartments";
import { ApartmentsTable } from "@/components/features/apartments/apartments-table";

export default async function ApartmentsPage() {
  const t = await getTranslations("apartments");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let apartments: Awaited<ReturnType<typeof getApartmentsEnriched>> = [];
  let buildings: Awaited<ReturnType<typeof getAllBuildingsBySyndicId>> = [];

  if (user) {
    apartments = await getApartmentsEnriched(user.id);
    buildings = await getAllBuildingsBySyndicId(user.id);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        {t("pageTitle")}
      </h1>
      <ApartmentsTable initialData={apartments} buildings={buildings} />
    </div>
  );
}
