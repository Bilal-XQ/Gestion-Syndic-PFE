import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getOwnerByUserId } from "@/lib/db/queries/owners";
import { getChargesForApartment } from "@/lib/db/queries/charges";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const role = user.app_metadata?.user_role;
  if (role !== "proprietaire") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerRecord = await getOwnerByUserId(user.id);
  if (!ownerRecord) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const charges = await getChargesForApartment(ownerRecord.apartmentId);
  return NextResponse.json(charges);
}
