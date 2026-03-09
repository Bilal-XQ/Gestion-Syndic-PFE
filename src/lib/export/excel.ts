import * as XLSX from "xlsx";

// ── Shared helper ────────────────────────────────────────────────────────────

function downloadSheet(
  rows: Record<string, unknown>[],
  headers: string[],
  filename: string,
  sheetName: string,
  colWidths?: number[]
): void {
  const ws = XLSX.utils.json_to_sheet(rows);

  // Overwrite auto-generated key header row with translated labels
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A1" });

  // Column widths (default 18 chars if not specified)
  ws["!cols"] = (colWidths ?? headers.map(() => 18)).map((w) => ({ wch: w }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Input types (mirror TanStack Query cache shapes) ─────────────────────────

export interface OwnerExportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  unitNumber: string;
  ownershipDate: string; // ISO date
}

export interface ChargeExportRow {
  title: string;
  apartmentUnit: string | null;
  category: string;
  totalAmount: string;     // numeric string from DB
  amountPaid: string;      // computed SQL — numeric string
  remainingAmount: string; // computed SQL — numeric string
  dueDate: string;         // ISO date
  status: string;          // 'paid' | 'partial' | 'unpaid'
}

export interface PaymentExportRow {
  ownerFirstName: string;
  ownerLastName: string;
  chargeTitle: string;
  amount: string;      // numeric string from DB
  paymentDate: string; // ISO date
  method: string;      // 'bank_transfer' | 'check' | 'cash'
  reference: string;
}

export interface OwnerPaymentExportRow {
  chargeTitle: string;
  chargeCategory: string;
  amount: string;      // numeric string from DB
  paymentDate: string; // ISO date
  method: string;
  reference: string;
}

// Column header translation map — all keys required so callers can pass the
// full common("export.columns") translation object without picking keys.
export interface ExportColumns {
  fullName: string;
  email: string;
  phone: string;
  apartment: string;
  ownershipDate: string;
  title: string;
  category: string;
  totalAmount: string;
  amountPaid: string;
  remaining: string;
  dueDate: string;
  status: string;
  currency: string;
  ownerName: string;
  chargeTitle: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
}

// ── Export functions ──────────────────────────────────────────────────────────

export function exportOwners(
  owners: OwnerExportRow[],
  columns: ExportColumns,
  sheetName: string
): void {
  const rows = owners.map((o) => ({
    fullName: `${o.firstName} ${o.lastName}`,
    email: o.email,
    phone: o.phone ?? "",
    apartment: o.unitNumber,
    ownershipDate: o.ownershipDate,
  }));

  downloadSheet(
    rows,
    [
      columns.fullName,
      columns.email,
      columns.phone,
      columns.apartment,
      columns.ownershipDate,
    ],
    `copropriétaires-${today()}.xlsx`,
    sheetName,
    [25, 30, 18, 12, 14]
  );
}

export function exportCharges(
  charges: ChargeExportRow[],
  columns: ExportColumns,
  sheetName: string
): void {
  const rows = charges.map((c) => ({
    title: c.title,
    apartment: c.apartmentUnit ?? "",
    category: c.category,
    totalAmount: parseFloat(c.totalAmount),
    amountPaid: parseFloat(c.amountPaid),
    remaining: parseFloat(c.remainingAmount),
    currency: "MAD",
    dueDate: c.dueDate,
    status: c.status,
  }));

  downloadSheet(
    rows,
    [
      columns.title,
      columns.apartment,
      columns.category,
      columns.totalAmount,
      columns.amountPaid,
      columns.remaining,
      columns.currency,
      columns.dueDate,
      columns.status,
    ],
    `charges-${today()}.xlsx`,
    sheetName,
    [25, 12, 15, 14, 14, 14, 8, 14, 10]
  );
}

export function exportPayments(
  payments: PaymentExportRow[],
  columns: ExportColumns,
  sheetName: string
): void {
  const rows = payments.map((p) => ({
    ownerName: `${p.ownerFirstName} ${p.ownerLastName}`,
    chargeTitle: p.chargeTitle,
    amount: parseFloat(p.amount),
    currency: "MAD",
    paymentDate: p.paymentDate,
    method: p.method,
    reference: p.reference,
  }));

  downloadSheet(
    rows,
    [
      columns.ownerName,
      columns.chargeTitle,
      columns.amount,
      columns.currency,
      columns.paymentDate,
      columns.method,
      columns.reference,
    ],
    `paiements-${today()}.xlsx`,
    sheetName,
    [25, 25, 14, 8, 14, 16, 20]
  );
}

export function exportOwnerPayments(
  payments: OwnerPaymentExportRow[],
  columns: ExportColumns,
  sheetName: string
): void {
  const rows = payments.map((p) => ({
    chargeTitle: p.chargeTitle,
    category: p.chargeCategory,
    amount: parseFloat(p.amount),
    currency: "MAD",
    paymentDate: p.paymentDate,
    method: p.method,
    reference: p.reference,
  }));

  downloadSheet(
    rows,
    [
      columns.chargeTitle,
      columns.category,
      columns.amount,
      columns.currency,
      columns.paymentDate,
      columns.method,
      columns.reference,
    ],
    `mes-paiements-${today()}.xlsx`,
    sheetName,
    [25, 15, 14, 8, 14, 16, 20]
  );
}
