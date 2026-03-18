import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getApartmentsEnriched } from "@/lib/db/queries/apartments";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const apartments = await getApartmentsEnriched(user.id);
  return NextResponse.json(apartments);
}
