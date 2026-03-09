# Phase 9 — Excel Export (XLSX)

## Overview

Add client-side `.xlsx` export to four list views using the `xlsx` (SheetJS)
package. Data is read directly from the TanStack Query cache — no new API
routes or DB queries are needed. Each export respects the currently active
filters so the user downloads exactly what they see on screen.

## Package to install

```bash
pnpm add xlsx
```

No other dependencies required. `xlsx` runs entirely in the browser — no
server-side code is involved in the export flow.

## Architecture

```
src/lib/export/
  excel.ts            ← pure functions: data in → browser download triggered
```

Each export function:

1. Accepts a typed data array + a column-header map (translated labels)
2. Builds rows using `XLSX.utils.json_to_sheet`
3. Overwrites header row with translated labels via `XLSX.utils.sheet_add_aoa`
4. Creates a workbook with `XLSX.utils.book_new` + `XLSX.utils.book_append_sheet`
5. Triggers a browser download with `XLSX.writeFile(wb, filename)`

No React, no hooks, no server calls inside `excel.ts`.

---

## SheetJS API summary (from Context7 docs)

```ts
import * as XLSX from "xlsx";

// Create worksheet from array of objects
const ws = XLSX.utils.json_to_sheet(rows);

// Overwrite header row with translated labels
XLSX.utils.sheet_add_aoa(ws, [["Col A", "Col B"]], { origin: "A1" });

// Set column widths
ws["!cols"] = [{ wch: 20 }, { wch: 30 }];

// Create workbook, append sheet, trigger download
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "output.xlsx");
```

`XLSX.writeFile` automatically triggers a file download in the browser.
Monetary values must be passed as `number` (not string) so Excel treats them
as numeric. Dates must be ISO strings (`YYYY-MM-DD`).

---

## Input types (derived from existing Drizzle query returns)

These types mirror the exact shapes already returned by the TanStack Query
hooks in each component. They are **not** new DB types — they describe the
objects the export functions receive from the cache.

### `OwnerExportRow`

Source: `useQuery<Owner[]>({ queryKey: ["owners"] })` in `owners-table.tsx`

```ts
interface OwnerExportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  unitNumber: string;
  ownershipDate: string; // ISO date
}
```

### `ChargeExportRow`

Source: `useQuery<Charge[]>({ queryKey: ["charges"] })` in `charges-table.tsx`

```ts
interface ChargeExportRow {
  title: string;
  apartmentUnit: string | null;
  category: string;
  totalAmount: string;   // numeric string from DB
  amountPaid: string;    // computed SQL — numeric string
  remainingAmount: string; // computed SQL — numeric string
  dueDate: string;       // ISO date
  status: string;        // 'paid' | 'partial' | 'unpaid'
}
```

### `PaymentExportRow`

Source: `useQuery<PaymentsResponse>({ queryKey: ["payments", filters] })` in
`payments-table.tsx`

```ts
interface PaymentExportRow {
  ownerFirstName: string;
  ownerLastName: string;
  chargeTitle: string;
  amount: string;        // numeric string from DB
  paymentDate: string;   // ISO date
  method: string;        // 'bank_transfer' | 'check' | 'cash'
  reference: string;
}
```

### `OwnerPaymentExportRow`

Source: `useQuery<Payment[]>({ queryKey: ["portal", "payments"] })` in
`owner-payments-view.tsx`

```ts
interface OwnerPaymentExportRow {
  chargeTitle: string;
  chargeCategory: string;
  amount: string;        // numeric string from DB
  paymentDate: string;   // ISO date
  method: string;
  reference: string;
}
```

---

## Step-by-step implementation

### Step 1 — Install `xlsx`

```bash
pnpm add xlsx
```

Verify with `pnpm ls xlsx`. Commit the lockfile change.

---

### Step 2 — Add translation keys

Add to the **common** namespace (`messages/{fr,en,ar}/common.json`) under a
new `"export"` key:

**French (`messages/fr/common.json`)**
```json
"export": {
  "button": "Exporter",
  "owners": "Exporter les copropriétaires",
  "charges": "Exporter les charges",
  "payments": "Exporter les paiements",
  "ownerPayments": "Exporter mes paiements",
  "sheetName": "Données",
  "columns": {
    "fullName": "Nom complet",
    "email": "E-mail",
    "phone": "Téléphone",
    "apartment": "Appartement",
    "ownershipDate": "Date de propriété",
    "title": "Titre",
    "category": "Catégorie",
    "totalAmount": "Montant total",
    "amountPaid": "Montant payé",
    "remaining": "Restant",
    "dueDate": "Échéance",
    "status": "Statut",
    "currency": "Devise",
    "ownerName": "Copropriétaire",
    "chargeTitle": "Charge",
    "amount": "Montant",
    "paymentDate": "Date de paiement",
    "method": "Méthode",
    "reference": "Référence"
  }
}
```

**English (`messages/en/common.json`)**
```json
"export": {
  "button": "Export",
  "owners": "Export owners",
  "charges": "Export charges",
  "payments": "Export payments",
  "ownerPayments": "Export my payments",
  "sheetName": "Data",
  "columns": {
    "fullName": "Full name",
    "email": "Email",
    "phone": "Phone",
    "apartment": "Apartment",
    "ownershipDate": "Ownership date",
    "title": "Title",
    "category": "Category",
    "totalAmount": "Total amount",
    "amountPaid": "Amount paid",
    "remaining": "Remaining",
    "dueDate": "Due date",
    "status": "Status",
    "currency": "Currency",
    "ownerName": "Owner",
    "chargeTitle": "Charge",
    "amount": "Amount",
    "paymentDate": "Payment date",
    "method": "Method",
    "reference": "Reference"
  }
}
```

**Arabic (`messages/ar/common.json`)**
```json
"export": {
  "button": "تصدير",
  "owners": "تصدير المالكين",
  "charges": "تصدير التكاليف",
  "payments": "تصدير المدفوعات",
  "ownerPayments": "تصدير مدفوعاتي",
  "sheetName": "بيانات",
  "columns": {
    "fullName": "الاسم الكامل",
    "email": "البريد الإلكتروني",
    "phone": "الهاتف",
    "apartment": "الشقة",
    "ownershipDate": "تاريخ الملكية",
    "title": "العنوان",
    "category": "الفئة",
    "totalAmount": "المبلغ الإجمالي",
    "amountPaid": "المبلغ المدفوع",
    "remaining": "المتبقي",
    "dueDate": "تاريخ الاستحقاق",
    "status": "الحالة",
    "currency": "العملة",
    "ownerName": "المالك",
    "chargeTitle": "التكلفة",
    "amount": "المبلغ",
    "paymentDate": "تاريخ الدفع",
    "method": "طريقة الدفع",
    "reference": "المرجع"
  }
}
```

---

### Step 3 — Create `src/lib/export/excel.ts`

This file contains **four** pure export functions plus a shared helper.
No React, no hooks. Each function:
- Accepts the data array (from query cache) and a `columns` record (translated headers)
- Converts monetary `string` values to `number` via `parseFloat`
- Appends a `"Currency"` column with value `"MAD"` for each monetary row
- Calls `XLSX.writeFile` to trigger the browser download

```ts
import * as XLSX from "xlsx";

// ── Shared helper ────────────────────────────────────────────
function downloadSheet(
  rows: Record<string, unknown>[],
  headers: string[],
  filename: string,
  sheetName: string,
  colWidths?: number[]
): void {
  const ws = XLSX.utils.json_to_sheet(rows);

  // Overwrite auto-generated header row with translated labels
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

// ── Types (mirror TanStack Query cache shapes) ──────────────

export interface OwnerExportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  unitNumber: string;
  ownershipDate: string;
}

export interface ChargeExportRow {
  title: string;
  apartmentUnit: string | null;
  category: string;
  totalAmount: string;
  amountPaid: string;
  remainingAmount: string;
  dueDate: string;
  status: string;
}

export interface PaymentExportRow {
  ownerFirstName: string;
  ownerLastName: string;
  chargeTitle: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
}

export interface OwnerPaymentExportRow {
  chargeTitle: string;
  chargeCategory: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
}

// Column header translation map shape
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

// ── Export functions ─────────────────────────────────────────

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
    [columns.fullName, columns.email, columns.phone, columns.apartment, columns.ownershipDate],
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
      columns.title, columns.apartment, columns.category,
      columns.totalAmount, columns.amountPaid, columns.remaining,
      columns.currency, columns.dueDate, columns.status,
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
      columns.ownerName, columns.chargeTitle, columns.amount,
      columns.currency, columns.paymentDate, columns.method, columns.reference,
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
      columns.chargeTitle, columns.category, columns.amount,
      columns.currency, columns.paymentDate, columns.method, columns.reference,
    ],
    `mes-paiements-${today()}.xlsx`,
    sheetName,
    [25, 15, 14, 8, 14, 16, 20]
  );
}
```

Key design decisions:
- `parseFloat` converts DB numeric strings to JS numbers so Excel sees them
  as numeric cells (supports formulas / SUM).
- A `"Currency"` column with `"MAD"` is appended next to every monetary
  column instead of formatting the number itself — keeps numbers pure.
- Dates stay as ISO `YYYY-MM-DD` strings — universal and sortable in Excel.
- `downloadSheet` is not exported — it's an internal helper.

---

### Step 4 — Add Export button to Owners table

**File:** `src/components/features/owners/owners-table.tsx`

**4a — Add imports:**

```ts
import { Download } from "lucide-react";  // add to existing lucide import
import { useTranslations as useT } from "next-intl"; // already imported
import { exportOwners, type ExportColumns } from "@/lib/export/excel";
```

**4b — Get translated columns inside component body:**

```ts
const tc = useTranslations("common");
// Build column header map from translations
const exportCols: ExportColumns = {
  fullName:      tc("export.columns.fullName"),
  email:         tc("export.columns.email"),
  phone:         tc("export.columns.phone"),
  apartment:     tc("export.columns.apartment"),
  ownershipDate: tc("export.columns.ownershipDate"),
  // remaining keys not used by exportOwners but required by interface:
  title: "", category: "", totalAmount: "", amountPaid: "",
  remaining: "", dueDate: "", status: "", currency: "",
  ownerName: "", chargeTitle: "", amount: "",
  paymentDate: "", method: "", reference: "",
};
```

**4c — Insert Export button in toolbar (before Add button):**

Current toolbar structure (`owners-table.tsx` lines 54–67):
```tsx
<div className="flex items-center justify-between gap-4">
  <div className="relative max-w-xs flex-1">
    <Search ... />
    <Input ... />
  </div>
  <Button onClick={...}>           ← Add owner
    <Plus className="size-4" />
    {t("addButton")}
  </Button>
</div>
```

Insert a `gap-2` wrapper around the two right-side buttons:
```tsx
<div className="flex items-center justify-between gap-4">
  <div className="relative max-w-xs flex-1">
    <Search ... />
    <Input ... />
  </div>
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      onClick={() => exportOwners(filtered, exportCols, tc("export.sheetName"))}
      disabled={filtered.length === 0}
    >
      <Download className="size-4" />
      {tc("export.button")}
    </Button>
    <Button onClick={...}>
      <Plus className="size-4" />
      {t("addButton")}
    </Button>
  </div>
</div>
```

**How filtered data is accessed:**
The `owners-table.tsx` component already computes `filtered` via:
```ts
const filtered = owners.filter((o) => {
  const fullName = `${o.firstName} ${o.lastName}`.toLowerCase();
  return fullName.includes(q) || o.email.toLowerCase().includes(q);
});
```
The export button passes `filtered` directly — exporting only what the user
currently sees.

---

### Step 5 — Add Export button to Charges table

**File:** `src/components/features/charges/charges-table.tsx`

The file already imports `Download` from lucide-react. Follow the same
pattern as Step 4:

**5a — Add imports:**
```ts
import { exportCharges, type ExportColumns } from "@/lib/export/excel";
```

**5b — Build `exportCols` using `tc("export.columns.*")`** (same pattern as
Step 4, but only the charge-relevant keys need real values).

**5c — Insert Export button** in the toolbar, between the search input and
the Add button. Same flex wrapper approach.

**How filtered data is accessed:**
```ts
const filtered = charges.filter((c) =>
  c.title.toLowerCase().includes(search.toLowerCase()) ||
  (c.apartmentUnit ?? "").toLowerCase().includes(search.toLowerCase())
);
```
Pass `filtered` to `exportCharges()`.

---

### Step 6 — Add Export button to Payments table

**File:** `src/components/features/payments/payments-table.tsx`

**6a — Add imports:**
```ts
import { Button } from "@/components/ui/button";    // not currently imported
import { Download } from "lucide-react";             // add to existing import
import { exportPayments, type ExportColumns } from "@/lib/export/excel";
```

**6b — Build `exportCols`** (same approach).

**6c — Insert Export button** at the end of the filters row. The toolbar is
a `flex flex-wrap items-end gap-4` div. Add the button as the last child:

```tsx
<div className="flex flex-wrap items-end gap-4">
  {/* ...existing DatePicker, Select filters... */}
  <Button
    variant="outline"
    onClick={() => exportPayments(payments, exportCols, tc("export.sheetName"))}
    disabled={payments.length === 0}
  >
    <Download className="size-4" />
    {tc("export.button")}
  </Button>
</div>
```

**How filtered data is accessed:**
Payments are **server-filtered** — the TanStack Query key includes all four
filter values `["payments", { dateFrom, dateTo, ownerId, category }]` and
the API already returns only matching results. So the `payments` array from
`data?.payments ?? []` already contains only filtered data. Pass it directly.

---

### Step 7 — Add Export button to Owner Portal Payment History

**File:** `src/components/features/payments/owner-payments-view.tsx`

**7a — Add imports:**
```ts
import { Download } from "lucide-react";     // may already be imported
import { exportOwnerPayments, type ExportColumns } from "@/lib/export/excel";
```

**7b — Build `exportCols`**.

**7c — Insert Export button** inside the "history" tab content, above or
beside the payment history table. The component uses `<Tabs>` with two tab
panels (`charges` and `history`). Add the button in the `history`
`TabsContent`, right before the table:

```tsx
<TabsContent value="history">
  <div className="flex justify-end mb-4">
    <Button
      variant="outline"
      onClick={() => exportOwnerPayments(payments, exportCols, tc("export.sheetName"))}
      disabled={payments.length === 0}
    >
      <Download className="size-4" />
      {tc("export.button")}
    </Button>
  </div>
  {/* existing payment history table */}
</TabsContent>
```

**How data is accessed:**
The component already fetches via:
```ts
const { data: payments = [] } = useQuery<Payment[]>({
  queryKey: ["portal", "payments"],
  queryFn: ...
});
```
No filters — the owner sees all their payments. Pass `payments` directly.

---

### Step 8 — TypeScript verification

```bash
pnpm tsc --noEmit
```

Expected: zero errors. If `xlsx` types are missing, install
`@types/xlsx` — but the `xlsx` package ships its own types so this should
not be needed.

---

### Step 9 — Build verification

```bash
pnpm build
```

Expected: `Compiled successfully`, all 26 routes generated. The `xlsx`
package is client-only — it should tree-shake from server bundles
automatically. If Next.js complains about server-side import, add
`"use client"` to `excel.ts` or ensure it's only imported from `"use client"`
components (which it will be, since all four table components are client
components).

---

### Step 10 — Manual QA checklist

| # | Test | Expected |
|---|------|----------|
| 1 | Click Export on `/dashboard/owners` | Downloads `copropriétaires-2026-03-08.xlsx` |
| 2 | Open file in Excel/LibreOffice | Columns: Nom complet, E-mail, Téléphone, Appartement, Date de propriété |
| 3 | Type search filter, then click Export | File contains only filtered owners |
| 4 | Click Export on `/dashboard/charges` | Downloads `charges-2026-03-08.xlsx` |
| 5 | Montant total column in Excel | Values are numbers (not `"5000.00"` strings) |
| 6 | Currency column value | `MAD` on every row |
| 7 | Filter charges by search text, then Export | Only filtered charges in file |
| 8 | Click Export on `/dashboard/payments` | Downloads `paiements-2026-03-08.xlsx` |
| 9 | Apply date range + owner filter, then Export | Only filtered payments in file |
| 10 | Switch to EN locale, export owners | Column headers appear in English |
| 11 | Switch to AR locale, export charges | Column headers appear in Arabic |
| 12 | Navigate to `/portal/payments`, History tab | Export button visible |
| 13 | Click Export in portal | Downloads `mes-paiements-2026-03-08.xlsx` |
| 14 | Open portal export in Excel | Columns: Charge, Catégorie, Montant, Date, Méthode, Référence |
| 15 | Export with 0 rows visible | Button is disabled (no empty file download) |

---

## Files created

| File | Type | Purpose |
|------|------|---------|
| `src/lib/export/excel.ts` | Pure TS | SheetJS export functions (4 entity exporters + 1 helper) |

## Files modified

| File | Change |
|------|--------|
| `package.json` | Add `xlsx` dependency |
| `messages/fr/common.json` | Add `export.*` translation keys |
| `messages/en/common.json` | Add `export.*` translation keys |
| `messages/ar/common.json` | Add `export.*` translation keys |
| `src/components/features/owners/owners-table.tsx` | Import export fn + add Export button in toolbar |
| `src/components/features/charges/charges-table.tsx` | Import export fn + add Export button in toolbar |
| `src/components/features/payments/payments-table.tsx` | Import Button + export fn + add Export button in filters row |
| `src/components/features/payments/owner-payments-view.tsx` | Import export fn + add Export button in History tab |

## What is NOT built (out of scope)

- No import functionality
- No CSV export
- No scheduled/email export
- No export of audit logs, meetings, or notifications
- No export of apartments (not requested)
- No server-side generation (API routes)
- No streaming/chunked download (data fits in memory)
