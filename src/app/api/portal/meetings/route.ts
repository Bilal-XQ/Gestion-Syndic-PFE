import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMeetingInvitationsForOwner } from "@/lib/db/queries/meetings";
import { owners } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";

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

  const ownerRows = await db
    .select({ id: owners.id })
    .from(owners)
    .where(and(eq(owners.userId, user.id), isNull(owners.deletedAt)))
    .limit(1);

  if (!ownerRows.length) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  const meetings = await getMeetingInvitationsForOwner(ownerRows[0].id);
  return NextResponse.json(meetings);
}
