"use server";

import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { charges, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import { createChargeSchema } from "@/lib/validations/charge";
import { getBuildingBySyndicId, getBuildingById } from "@/lib/db/queries/buildings";
import { getChargeById } from "@/lib/db/queries/charges";
import { getApartmentById } from "@/lib/db/queries/apartments";
import { getOwnerByApartmentId, getOwnerById, getOwnerByUserId } from "@/lib/db/queries/owners";
import { PaymentReminderEmail } from "@/lib/email/templates/payment-reminder";
import { renderPaymentNotice } from "@/lib/pdf/payment-notice";

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helper: authenticate + authorize syndic
// ---------------------------------------------------------------------------
async function getAuthenticatedSyndic() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return null;

  return user;
}

// ---------------------------------------------------------------------------
// Create charge
// ---------------------------------------------------------------------------
export async function createCharge(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createChargeSchema(t);
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // 2. Authenticate
  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  // 3. Verify apartment belongs to syndic's building
  const building = await getBuildingBySyndicId(user.id);
  if (!building) return { success: false, error: "Immeuble introuvable" };

  const apartment = await getApartmentById(parsed.data.apartmentId);
  if (!apartment || apartment.buildingId !== building.id) {
    return { success: false, error: "Appartement introuvable" };
  }

  // 4. Insert
  const [newCharge] = await db
    .insert(charges)
    .values({
      syndicId: user.id,
      apartmentId: parsed.data.apartmentId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      totalAmount: String(parsed.data.totalAmount),
      dueDate: parsed.data.dueDate,
    })
    .returning({ id: charges.id });

  // 5. Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "CREATE_CHARGE",
    entityType: "charges",
    entityId: newCharge.id,
  });

  return { success: true, data: { id: newCharge.id } };
}

// ---------------------------------------------------------------------------
// Delete charge (soft-delete)
// ---------------------------------------------------------------------------
export async function deleteCharge(id: string): Promise<ActionResult> {
  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  const charge = await getChargeById(id);
  if (!charge || charge.syndicId !== user.id) {
    return { success: false, error: "Charge introuvable" };
  }

  await db
    .update(charges)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(charges.id, id));

  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DELETE_CHARGE",
    entityType: "charges",
    entityId: id,
  });

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Send payment reminder
// ---------------------------------------------------------------------------
export async function sendPaymentReminder(
  chargeId: string
): Promise<ActionResult> {
  const user = await getAuthenticatedSyndic();
  if (!user) return { success: false, error: "Non authentifié" };

  // Load charge with derived values
  const charge = await getChargeById(chargeId);
  if (!charge || charge.syndicId !== user.id) {
    return { success: false, error: "Charge introuvable" };
  }

  if (Number(charge.remainingAmount) <= 0) {
    return { success: false, error: "Cette charge est déjà payée" };
  }

  // Get owner for this apartment
  const ownerRecord = await getOwnerByApartmentId(charge.apartmentId);
  if (!ownerRecord) {
    return {
      success: false,
      error: "Aucun propriétaire actif pour cet appartement",
    };
  }

  const owner = await getOwnerById(ownerRecord.id);
  if (!owner) {
    return { success: false, error: "Propriétaire introuvable" };
  }

  const building = await getBuildingBySyndicId(user.id);
  if (!building) return { success: false, error: "Immeuble introuvable" };

  // Send email
  await resend.emails.send({
    from: "Syndic <onboarding@resend.dev>",
    to: owner.email,
    subject: `Rappel de paiement — ${charge.title}`,
    react: PaymentReminderEmail({
      ownerName: `${owner.firstName} ${owner.lastName}`,
      chargeTitle: charge.title,
      totalAmount: charge.totalAmount,
      amountPaid: charge.amountPaid,
      remainingAmount: charge.remainingAmount,
      dueDate: charge.dueDate,
      buildingName: building.name,
      buildingAddress: building.address,
    }),
  });

  // Update last_reminder_sent_at
  await db
    .update(charges)
    .set({ lastReminderSentAt: new Date(), updatedAt: new Date() })
    .where(eq(charges.id, chargeId));

  // Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "SEND_REMINDER",
    entityType: "charges",
    entityId: chargeId,
  });

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Download payment notice PDF
// ---------------------------------------------------------------------------
export async function downloadPaymentNotice(
  chargeId: string
): Promise<ActionResult<{ buffer: string; filename: string }>> {
  // 1. Authenticate — allow both syndic and proprietaire
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { success: false, error: "Non authentifié" };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic" && role !== "proprietaire") {
    return { success: false, error: "Accès refusé" };
  }

  // 2. Load charge
  const charge = await getChargeById(chargeId);
  if (!charge) return { success: false, error: "Charge introuvable" };

  // 3. Authorize based on role
  if (role === "syndic") {
    if (charge.syndicId !== user.id) {
      return { success: false, error: "Charge introuvable" };
    }
  }
  if (role === "proprietaire") {
    const ownerCheck = await getOwnerByUserId(user.id);
    if (!ownerCheck || charge.apartmentId !== ownerCheck.apartmentId) {
      return { success: false, error: "Accès refusé" };
    }
  }

  // 4. Load apartment and owner
  const apartment = await getApartmentById(charge.apartmentId);
  if (!apartment) return { success: false, error: "Appartement introuvable" };

  const ownerRecord = await getOwnerByApartmentId(charge.apartmentId);
  const owner = ownerRecord ? await getOwnerById(ownerRecord.id) : null;

  // 5. Resolve building based on role
  let building;
  if (role === "syndic") {
    building = await getBuildingBySyndicId(user.id);
  } else {
    building = await getBuildingById(apartment.buildingId);
  }
  if (!building) return { success: false, error: "Immeuble introuvable" };

  const buffer = await renderPaymentNotice({
    owner: owner
      ? {
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
          phone: owner.phone ?? undefined,
        }
      : { firstName: "N/A", lastName: "", email: "" },
    apartment: {
      unitNumber: apartment.unitNumber,
      floor: apartment.floor,
      buildingName: building.name,
    },
    charge: {
      title: charge.title,
      description: charge.description ?? undefined,
      category: charge.category,
      totalAmount: charge.totalAmount,
      amountPaid: charge.amountPaid,
      remainingAmount: charge.remainingAmount,
      dueDate: charge.dueDate,
    },
    building: {
      name: building.name,
      address: building.address,
    },
    generatedAt: new Date().toISOString(),
  });

  const base64 = Buffer.from(buffer).toString("base64");
  const filename = `avis-paiement-${charge.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return { success: true, data: { buffer: base64, filename } };
}
