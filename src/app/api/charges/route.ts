import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getChargesWithPaymentStatus } from "@/lib/db/queries/charges";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const charges = await getChargesWithPaymentStatus(user.id);
  return NextResponse.json(charges);
}
