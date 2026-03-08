import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getPaymentsGlobal,
  getFinancialSummary,
} from "@/lib/db/queries/payments";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filters = {
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    ownerId: searchParams.get("ownerId") ?? undefined,
    category: searchParams.get("category") ?? undefined,
  };

  const [payments, summary] = await Promise.all([
    getPaymentsGlobal(user.id, filters),
    getFinancialSummary(user.id),
  ]);

  return NextResponse.json({ payments, summary });
}
