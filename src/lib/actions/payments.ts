"use server";

import { db } from "@/lib/db";
import { payments, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { createPaymentSchema } from "@/lib/validations/payment";
import { getChargeById } from "@/lib/db/queries/charges";
import { getOwnerByUserId } from "@/lib/db/queries/owners";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Create payment — MUST use db.transaction()
// ---------------------------------------------------------------------------
export async function createPayment(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const t = await getTranslations("validation");
  const tc = await getTranslations("common");
  const schema = createPaymentSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: tc("errors.unauthenticated") };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic" && role !== "proprietaire") {
    return { success: false, error: tc("errors.forbidden") };
  }

  // 3. Load charge and validate ceiling
  const charge = await getChargeById(parsed.data.chargeId);
  if (!charge) return { success: false, error: tc("errors.chargeNotFound") };

  const remaining = Number(charge.remainingAmount);
  if (remaining <= 0) {
    return { success: false, error: tc("errors.alreadyPaid") };
  }

  if (parsed.data.amount > remaining) {
    return {
      success: false,
      error: tc("errors.paymentExceedsRemaining"),
    };
  }

  // 3b. Proprietaire: override ownerId from JWT — prevent IDOR
  let ownerId = parsed.data.ownerId;
  if (role === "proprietaire") {
    const ownerRecord = await getOwnerByUserId(user.id);
    if (!ownerRecord) {
      return { success: false, error: tc("errors.ownerNotFound") };
    }
    ownerId = ownerRecord.id;

    // Verify the charge belongs to the owner's apartment
    if (charge.apartmentId !== ownerRecord.apartmentId) {
      return { success: false, error: tc("errors.forbidden") };
    }
  }

  // 4. Insert payment inside transaction
  const [newPayment] = await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(payments)
      .values({
        chargeId: parsed.data.chargeId,
        ownerId: ownerId,
        amount: String(parsed.data.amount),
        paymentDate: parsed.data.paymentDate,
        method: parsed.data.method,
        reference: parsed.data.reference,
        notes: parsed.data.notes ?? null,
      })
      .returning({ id: payments.id });
    return [payment];
  });

  // 5. Audit log — OUTSIDE the transaction (uses db, not tx)
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CREATE_PAYMENT",
    entityType: "payments",
    entityId: newPayment.id,
  });

  return { success: true, data: { id: newPayment.id } };
}
