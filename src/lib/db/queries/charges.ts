import { eq, and, isNull, sql, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { charges, payments, apartments, owners, users } from "@/lib/db/schema";

// ─── Computed columns (never stored) ──────────────────────────────────
const amountPaid = sql<string>`COALESCE(SUM(${payments.amount}), 0)`;
const remainingAmount = sql<string>`${charges.totalAmount} - COALESCE(SUM(${payments.amount}), 0)`;
const chargeStatus = sql<string>`
  CASE
    WHEN ${charges.totalAmount} - COALESCE(SUM(${payments.amount}), 0) = 0 THEN 'paid'
    WHEN COALESCE(SUM(${payments.amount}), 0) > 0 THEN 'partial'
    ELSE 'unpaid'
  END
`;

/**
 * All active charges for a syndic with derived financial fields.
 */
export async function getChargesWithPaymentStatus(syndicId: string) {
  return db
    .select({
      id: charges.id,
      syndicId: charges.syndicId,
      apartmentId: charges.apartmentId,
      title: charges.title,
      description: charges.description,
      category: charges.category,
      totalAmount: charges.totalAmount,
      dueDate: charges.dueDate,
      lastReminderSentAt: charges.lastReminderSentAt,
      createdAt: charges.createdAt,
      amountPaid,
      remainingAmount,
      status: chargeStatus,
    })
    .from(charges)
    .leftJoin(payments, eq(payments.chargeId, charges.id))
    .where(and(eq(charges.syndicId, syndicId), isNull(charges.deletedAt)))
    .groupBy(charges.id)
    .orderBy(charges.createdAt);
}

/**
 * Single charge by ID with derived financial fields.
 */
export async function getChargeById(id: string) {
  const [charge] = await db
    .select({
      id: charges.id,
      syndicId: charges.syndicId,
      apartmentId: charges.apartmentId,
      title: charges.title,
      description: charges.description,
      category: charges.category,
      totalAmount: charges.totalAmount,
      dueDate: charges.dueDate,
      lastReminderSentAt: charges.lastReminderSentAt,
      createdAt: charges.createdAt,
      amountPaid,
      remainingAmount,
      status: chargeStatus,
    })
    .from(charges)
    .leftJoin(payments, eq(payments.chargeId, charges.id))
    .where(and(eq(charges.id, id), isNull(charges.deletedAt)))
    .groupBy(charges.id);

  return charge ?? null;
}

/**
 * Active charges for a specific apartment with derived values.
 * Reused in Phase 5 owner portal.
 */
export async function getChargesForApartment(apartmentId: string) {
  return db
    .select({
      id: charges.id,
      syndicId: charges.syndicId,
      apartmentId: charges.apartmentId,
      title: charges.title,
      description: charges.description,
      category: charges.category,
      totalAmount: charges.totalAmount,
      dueDate: charges.dueDate,
      lastReminderSentAt: charges.lastReminderSentAt,
      createdAt: charges.createdAt,
      amountPaid,
      remainingAmount,
      status: chargeStatus,
    })
    .from(charges)
    .leftJoin(payments, eq(payments.chargeId, charges.id))
    .where(
      and(eq(charges.apartmentId, apartmentId), isNull(charges.deletedAt))
    )
    .groupBy(charges.id)
    .orderBy(charges.createdAt);
}

/**
 * Overdue charges: due_date in the past AND remaining_amount > 0.
 * Joins owner + user for dashboard display.
 */
export async function getOverdueCharges(syndicId: string) {
  return db
    .select({
      id: charges.id,
      title: charges.title,
      totalAmount: charges.totalAmount,
      dueDate: charges.dueDate,
      apartmentId: charges.apartmentId,
      unitNumber: apartments.unitNumber,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      remainingAmount,
    })
    .from(charges)
    .leftJoin(payments, eq(payments.chargeId, charges.id))
    .innerJoin(apartments, eq(charges.apartmentId, apartments.id))
    .leftJoin(
      owners,
      and(eq(owners.apartmentId, charges.apartmentId), isNull(owners.deletedAt))
    )
    .leftJoin(users, eq(owners.userId, users.id))
    .where(
      and(
        eq(charges.syndicId, syndicId),
        isNull(charges.deletedAt),
        lt(charges.dueDate, sql`CURRENT_DATE`)
      )
    )
    .groupBy(
      charges.id,
      charges.title,
      charges.totalAmount,
      charges.dueDate,
      charges.apartmentId,
      apartments.unitNumber,
      users.firstName,
      users.lastName
    )
    .having(sql`${charges.totalAmount} - COALESCE(SUM(${payments.amount}), 0) > 0`);
}
