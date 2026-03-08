import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getBuildingBySyndicId } from "@/lib/db/queries/buildings";
import { getMeetings, getMeetingsForOwner } from "@/lib/db/queries/meetings";
import { getOwnerByUserId } from "@/lib/db/queries/owners";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const role = user.app_metadata?.user_role as string | undefined;

  if (role === "syndic") {
    const building = await getBuildingBySyndicId(user.id);
    if (!building) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await getMeetings(user.id);
    return NextResponse.json(data);
  }

  if (role === "proprietaire") {
    const owner = await getOwnerByUserId(user.id);
    if (!owner) {
      return NextResponse.json([], { status: 200 });
    }
    const data = await getMeetingsForOwner(owner.id);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
