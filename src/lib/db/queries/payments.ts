import { eq, and, isNull, sql, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, charges, owners, users, apartments, buildings } from "@/lib/db/schema";

export interface PaymentFilters {
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
  category?: string;
}

/**
 * Global payment history for a syndic — filterable.
 * Joins payments → charges → apartments and owners → users for display.
 */
export async function getPaymentsGlobal(
  syndicId: string,
  filters?: PaymentFilters
) {
  const conditions = [
    eq(charges.syndicId, syndicId),
    isNull(charges.deletedAt),
  ];

  if (filters?.dateFrom) {
    conditions.push(gte(payments.paymentDate, filters.dateFrom));
  }
  if (filters?.dateTo) {
    conditions.push(lte(payments.paymentDate, filters.dateTo));
  }
  if (filters?.ownerId) {
    conditions.push(eq(payments.ownerId, filters.ownerId));
  }
  if (filters?.category) {
    conditions.push(eq(charges.category, filters.category));
  }

  return db
    .select({
      id: payments.id,
      chargeId: payments.chargeId,
      ownerId: payments.ownerId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      createdAt: payments.createdAt,
      chargeTitle: charges.title,
      chargeCategory: charges.category,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      unitNumber: apartments.unitNumber,
    })
    .from(payments)
    .innerJoin(charges, eq(payments.chargeId, charges.id))
    .innerJoin(owners, eq(payments.ownerId, owners.id))
    .innerJoin(users, eq(owners.userId, users.id))
    .innerJoin(apartments, eq(charges.apartmentId, apartments.id))
    .where(and(...conditions))
    .orderBy(payments.paymentDate);
}

/**
 * All payments for a specific charge.
 */
export async function getPaymentsForCharge(chargeId: string) {
  return db
    .select({
      id: payments.id,
      ownerId: payments.ownerId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      createdAt: payments.createdAt,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
    })
    .from(payments)
    .innerJoin(owners, eq(payments.ownerId, owners.id))
    .innerJoin(users, eq(owners.userId, users.id))
    .where(eq(payments.chargeId, chargeId))
    .orderBy(payments.paymentDate);
}

/**
 * All payments for a specific owner.
 * Reused in Phase 5 owner portal.
 */
export async function getPaymentsForOwner(ownerId: string) {
  return db
    .select({
      id: payments.id,
      chargeId: payments.chargeId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      createdAt: payments.createdAt,
      chargeTitle: charges.title,
      chargeCategory: charges.category,
    })
    .from(payments)
    .innerJoin(charges, eq(payments.chargeId, charges.id))
    .where(eq(payments.ownerId, ownerId))
    .orderBy(payments.paymentDate);
}

/**
 * Financial summary for the syndic: total issued, collected, outstanding.
 */
export async function getFinancialSummary(syndicId: string) {
  const [chargesTotal] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${charges.totalAmount}), 0)`,
    })
    .from(charges)
    .where(and(eq(charges.syndicId, syndicId), isNull(charges.deletedAt)));

  const [paymentsTotal] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(charges, eq(payments.chargeId, charges.id))
    .where(and(eq(charges.syndicId, syndicId), isNull(charges.deletedAt)));

  const totalChargesIssued = chargesTotal?.total ?? "0";
  const totalCollected = paymentsTotal?.total ?? "0";
  const totalOutstanding = String(
    Number(totalChargesIssued) - Number(totalCollected)
  );

  return { totalChargesIssued, totalCollected, totalOutstanding };
}

/**
 * Monthly payment totals for the last 6 months, grouped by month.
 * Pads missing months with total: 0.
 */
export async function getMonthlyPaymentTotals(
  syndicId: string
): Promise<{ month: string; total: number }[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const dateFilter = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

  const rows = await db
    .select({
      month: sql<string>`date_trunc('month', ${payments.paymentDate}::date)::text`,
      total: sql<string>`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(payments)
    .innerJoin(charges, eq(payments.chargeId, charges.id))
    .innerJoin(apartments, eq(charges.apartmentId, apartments.id))
    .innerJoin(buildings, eq(apartments.buildingId, buildings.id))
    .where(
      and(
        eq(buildings.syndicId, syndicId),
        isNull(charges.deletedAt),
        gte(payments.paymentDate, dateFilter)
      )
    )
    .groupBy(sql`date_trunc('month', ${payments.paymentDate}::date)`)
    .orderBy(sql`date_trunc('month', ${payments.paymentDate}::date)`);

  const monthMap = new Map<string, number>(
    rows.map((r) => [r.month.substring(0, 7), Number(r.total)])
  );

  const result: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      month: `${key}-01T00:00:00.000Z`,
      total: monthMap.get(key) ?? 0,
    });
  }

  return result;
}
