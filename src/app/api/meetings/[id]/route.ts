import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getMeetingById } from "@/lib/db/queries/meetings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getMeetingById(id);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify the syndic owns this meeting
  const role = user.app_metadata?.user_role as string | undefined;
  if (role === "syndic" && result.meeting.syndicId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(result);
}
