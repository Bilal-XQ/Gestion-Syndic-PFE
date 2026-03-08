import { createClient } from "@/utils/supabase/server";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { getApartments } from "@/lib/db/queries/apartments";
import { ApartmentsTable } from "@/components/features/apartments/apartments-table";

export default async function ApartmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let apartments: Awaited<ReturnType<typeof getApartments>> = [];
  let buildingId = "";

  if (user) {
    const building = await getBuildingBySyndicId(user.id);
    if (building) {
      apartments = await getApartments(building.id);
      buildingId = building.id;
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Appartements
      </h1>
      <ApartmentsTable initialData={apartments} buildingId={buildingId} />
    </div>
  );
}
