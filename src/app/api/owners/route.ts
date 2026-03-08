import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { getActiveOwners } from "@/lib/db/queries/owners";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const building = await getBuildingBySyndicId(user.id);
  if (!building) {
    return NextResponse.json([], { status: 200 });
  }

  const owners = await getActiveOwners(building.id);
  return NextResponse.json(owners);
}
