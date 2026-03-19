"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { owners, users, apartments, auditLogs } from "@/lib/db/schema";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getTranslations } from "next-intl/server";
import { createOwnerSchema } from "@/lib/validations/owner";
import { getBuildingById } from "@/lib/db/queries/buildings";
import { getOwnerById } from "@/lib/db/queries/owners";
import { getApartmentById } from "@/lib/db/queries/apartments";
import { Resend } from "resend";
import { WelcomeEmail } from "@/lib/email/templates/welcome";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

const resend = new Resend(process.env.RESEND_API_KEY);

async function getScopedApartmentForSyndic(
  syndicId: string,
  apartmentId: string
) {
  const apartment = await getApartmentById(apartmentId);
  if (!apartment) return null;

  const building = await getBuildingById(apartment.buildingId);
  if (!building || building.syndicId !== syndicId) return null;

  return apartment;
}

// ---------------------------------------------------------------------------
// Create owner (+ auth account + apartment status transition)
// ---------------------------------------------------------------------------
export async function createOwner(
  values: unknown
): Promise<ActionResult<{ id: string }>> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createOwnerSchema(t);
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
  if (authError || !user) return { success: false, error: "Non authentifié" };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return { success: false, error: "Accès refusé" };

  // 3. Verify apartment belongs to syndic and is vacant
  const apartment = await getScopedApartmentForSyndic(
    user.id,
    parsed.data.apartmentId
  );
  if (!apartment) {
    return { success: false, error: "Appartement introuvable" };
  }
  if (apartment.status !== "vacant") {
    return { success: false, error: "Appartement déjà occupé" };
  }

  // 4. Create auth account via admin client
  const tempPassword = crypto.randomUUID().slice(0, 12);
  const supabaseAdmin = createAdminClient();

  const { data: authData, error: createUserError } =
    await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: tempPassword,
      email_confirm: true,
      app_metadata: { user_role: "proprietaire" },
      user_metadata: { role: "proprietaire" },
    });

  if (createUserError || !authData.user) {
    return {
      success: false,
      error: createUserError?.message ?? "Erreur lors de la création du compte",
    };
  }

  try {
    // 5. Upsert user row (trigger may have already inserted a partial row)
    await db
      .insert(users)
      .values({
        id: authData.user.id,
        email: parsed.data.email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone ?? null,
        role: "proprietaire",
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          phone: parsed.data.phone ?? null,
          updatedAt: new Date(),
        },
      });

    // 6. Insert owner row
    const [newOwner] = await db
      .insert(owners)
      .values({
        userId: authData.user.id,
        apartmentId: parsed.data.apartmentId,
        ownershipDate: parsed.data.ownershipDate,
      })
      .returning({ id: owners.id });

    // 7. Apartment status → occupied
    await db
      .update(apartments)
      .set({ status: "occupied", updatedAt: new Date() })
      .where(eq(apartments.id, parsed.data.apartmentId));

    // 8. Send welcome email
    try {
      await resend.emails.send({
        from: "Syndic <onboarding@resend.dev>",
        to: parsed.data.email,
        subject: "Bienvenue sur votre espace copropriétaire",
        react: WelcomeEmail({
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          email: parsed.data.email,
          tempPassword,
          loginUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? "" : ""}${typeof window === "undefined" ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" : ""}/login`,
        }),
      });
    } catch {
      // Email failure should not block owner creation
      console.error("Failed to send welcome email");
    }

    // 9. Audit log (outside transaction)
    await db.insert(auditLogs).values({
      userId: user.id,
      action: "CREATE_OWNER",
      entityType: "owners",
      entityId: newOwner.id,
    });

    return { success: true, data: { id: newOwner.id } };
  } catch (error) {
    // Cleanup: delete auth user and any partial public.users row
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    await db.delete(users).where(eq(users.id, authData.user.id));
    return {
      success: false,
      error: "Erreur lors de la création du copropriétaire",
    };
  }
}

// ---------------------------------------------------------------------------
// Update owner
// ---------------------------------------------------------------------------
export async function updateOwner(
  id: string,
  values: unknown
): Promise<ActionResult> {
  // 1. Validate
  const t = await getTranslations("validation");
  const schema = createOwnerSchema(t);
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
  if (authError || !user) return { success: false, error: "Non authentifié" };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return { success: false, error: "Accès refusé" };

  // 3. Get existing owner
  const existingOwner = await getOwnerById(id);
  if (!existingOwner) {
    return { success: false, error: "Copropriétaire introuvable" };
  }

  const existingApartment = await getScopedApartmentForSyndic(
    user.id,
    existingOwner.apartmentId
  );
  if (!existingApartment) {
    return { success: false, error: "Copropriétaire introuvable" };
  }

  // 4. Update user record (NOT email — email is immutable after creation)
  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, existingOwner.userId));

  // 5. Handle apartment reassignment
  if (parsed.data.apartmentId !== existingOwner.apartmentId) {
    const nextApartment = await getScopedApartmentForSyndic(
      user.id,
      parsed.data.apartmentId
    );
    if (!nextApartment) {
      return { success: false, error: "Appartement introuvable" };
    }
    if (nextApartment.status !== "vacant") {
      return { success: false, error: "Appartement déjà occupé" };
    }

    // Set old apartment to vacant
    await db
      .update(apartments)
      .set({ status: "vacant", updatedAt: new Date() })
      .where(eq(apartments.id, existingOwner.apartmentId));

    // Set new apartment to occupied
    await db
      .update(apartments)
      .set({ status: "occupied", updatedAt: new Date() })
      .where(eq(apartments.id, parsed.data.apartmentId));

    // Update owner's apartment
    await db
      .update(owners)
      .set({
        apartmentId: parsed.data.apartmentId,
        ownershipDate: parsed.data.ownershipDate,
        updatedAt: new Date(),
      })
      .where(eq(owners.id, id));
  } else {
    // Just update ownership date if changed
    await db
      .update(owners)
      .set({
        ownershipDate: parsed.data.ownershipDate,
        updatedAt: new Date(),
      })
      .where(eq(owners.id, id));
  }

  // 6. Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "UPDATE_OWNER",
    entityType: "owners",
    entityId: id,
  });

  return { success: true, data: null };
}

// ---------------------------------------------------------------------------
// Soft-delete owner
// ---------------------------------------------------------------------------
export async function deleteOwner(
  id: string
): Promise<ActionResult> {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Non authentifié" };

  const role = user.app_metadata?.user_role as string | undefined;
  if (role !== "syndic") return { success: false, error: "Accès refusé" };

  // 2. Get existing owner
  const existingOwner = await getOwnerById(id);
  if (!existingOwner) {
    return { success: false, error: "Copropriétaire introuvable" };
  }

  const existingApartment = await getScopedApartmentForSyndic(
    user.id,
    existingOwner.apartmentId
  );
  if (!existingApartment) {
    return { success: false, error: "Copropriétaire introuvable" };
  }

  // 3. Soft-delete owner
  await db
    .update(owners)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(owners.id, id));

  // 4. Soft-delete user record
  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, existingOwner.userId));

  // 5. Apartment status → vacant
  await db
    .update(apartments)
    .set({ status: "vacant", updatedAt: new Date() })
    .where(eq(apartments.id, existingOwner.apartmentId));

  // 6. Audit log
  await db.insert(auditLogs).values({
    userId: user.id,
    action: "DELETE_OWNER",
    entityType: "owners",
    entityId: id,
  });

  return { success: true, data: null };
}
