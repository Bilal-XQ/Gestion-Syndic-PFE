import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getApartmentEnrichedById } from "@/lib/db/queries/apartments";
import { getChargesForApartment } from "@/lib/db/queries/charges";

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

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const apartment = await getApartmentEnrichedById(user.id, id);
  if (!apartment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const charges = await getChargesForApartment(id);
  const totalCharged = charges
    .reduce((sum, c) => sum + Number(c.totalAmount), 0)
    .toString();
  const totalPaid = charges
    .reduce((sum, c) => sum + Number(c.amountPaid), 0)
    .toString();
  const remaining = (Number(totalCharged) - Number(totalPaid)).toString();

  return NextResponse.json({
    apartment,
    charges: charges.map((charge) => ({
      id: charge.id,
      title: charge.title,
      totalAmount: charge.totalAmount,
      amountPaid: charge.amountPaid,
      remainingAmount: charge.remainingAmount,
      status: charge.status,
    })),
    summary: {
      totalCharged,
      totalPaid,
      remaining,
    },
  });
}