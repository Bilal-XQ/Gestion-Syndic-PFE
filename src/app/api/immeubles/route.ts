import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAllBuildingsBySyndicId } from "@/lib/db/queries/buildings";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const buildings = await getAllBuildingsBySyndicId(user.id);
  return NextResponse.json(buildings);
}
