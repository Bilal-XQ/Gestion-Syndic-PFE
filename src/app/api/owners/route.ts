import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getActiveOwnersBySyndicId } from "@/lib/db/queries/owners";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const owners = await getActiveOwnersBySyndicId(user.id);
  return NextResponse.json(owners);
}
