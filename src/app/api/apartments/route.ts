import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getApartmentsEnriched } from "@/lib/db/queries/apartments";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const apartments = await getApartmentsEnriched(user.id);

  if (status === "vacant" || status === "occupied") {
    return NextResponse.json(apartments.filter((apt) => apt.status === status));
  }

  return NextResponse.json(apartments);
}
