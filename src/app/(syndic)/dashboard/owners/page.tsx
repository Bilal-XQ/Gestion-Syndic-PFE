import { createClient } from "@/utils/supabase/server";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { getActiveOwners } from "@/lib/db/queries/owners";
import { OwnersTable } from "@/components/features/owners/owners-table";

export default async function OwnersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let owners: Awaited<ReturnType<typeof getActiveOwners>> = [];

  if (user) {
    const building = await getBuildingBySyndicId(user.id);
    if (building) {
      owners = await getActiveOwners(building.id);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Copropriétaires
      </h1>
      <OwnersTable initialData={owners} />
    </div>
  );
}
