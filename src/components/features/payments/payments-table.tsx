"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search, Download } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDate, formatMAD } from "@/lib/formatters";
import { exportPayments, type ExportColumns } from "@/lib/export/excel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Payment = {
  id: string;
  chargeId: string;
  ownerId: string;
  amount: string;
  paymentDate: string;
  method: string;
  reference: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  chargeTitle: string;
  ownerFirstName: string;
  ownerLastName: string;
  apartmentUnit: string;
  chargeCategory: string;
};

type FinancialSummary = {
  totalChargesIssued: string;
  totalCollected: string;
  totalOutstanding: string;
};

type PaymentsResponse = {
  payments: Payment[];
  summary: FinancialSummary;
};

type Owner = {
  id: string;
  userId: string;
  apartmentId: string;
  firstName: string;
  lastName: string;
  email: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const methodLabels: Record<string, string> = {
  bank_transfer: "Virement",
  check: "Chèque",
  cash: "Espèces",
};

const categoryOptions = [
  { value: "all", label: "Toutes catégories" },
  { value: "electricity", label: "Électricité" },
  { value: "water", label: "Eau" },
  { value: "maintenance", label: "Entretien" },
  { value: "repair", label: "Réparation" },
  { value: "other", label: "Autre" },
] as const;

async function fetchPayments(filters: {
  dateFrom: string;
  dateTo: string;
  ownerId: string;
  category: string;
}): Promise<PaymentsResponse> {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.ownerId && filters.ownerId !== "all") params.set("ownerId", filters.ownerId);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);

  const res = await fetch(`/api/payments?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
}

async function fetchOwners(): Promise<Owner[]> {
  const res = await fetch("/api/owners");
  if (!res.ok) throw new Error("Failed to fetch owners");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function PaymentsTable() {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const exportCols: ExportColumns = {
    ownerName: tc("export.columns.ownerName"),
    chargeTitle: tc("export.columns.chargeTitle"),
    amount: tc("export.columns.amount"),
    currency: tc("export.columns.currency"),
    paymentDate: tc("export.columns.paymentDate"),
    method: tc("export.columns.method"),
    reference: tc("export.columns.reference"),
    fullName: "", email: "", phone: "", apartment: "", ownershipDate: "",
    title: "", category: "", totalAmount: "", amountPaid: "",
    remaining: "", dueDate: "", status: "",
  };
  const methodLabels: Record<string, string> = {
    bank_transfer: tc("paymentMethods.transfer"),
    check: tc("paymentMethods.check"),
    cash: tc("paymentMethods.cash"),
  };
  const categoryOptions = [
    { value: "all", label: t("filters.allCategories") },
    { value: "electricity", label: tc("categories.electricity") },
    { value: "water", label: tc("categories.water") },
    { value: "maintenance", label: tc("categories.maintenance") },
    { value: "repair", label: tc("categories.repair") },
    { value: "other", label: tc("categories.other") },
  ];
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [ownerId, setOwnerId] = useState("all");
  const [category, setCategory] = useState("all");

  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: ["owners"],
    queryFn: fetchOwners,
  });

  const { data, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ["payments", { dateFrom, dateTo, ownerId, category }],
    queryFn: () => fetchPayments({ dateFrom, dateTo, ownerId, category }),
  });

  const payments = data?.payments ?? [];
  const summary = data?.summary ?? {
    totalChargesIssued: "0",
    totalCollected: "0",
    totalOutstanding: "0",
  };

  return (
    <>
      {/* Financial summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-[--border-default] bg-[--bg-card] p-5">
          <p className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
            {t("summary.totalCharges")}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-[--text-primary]">
            {formatMAD(summary.totalChargesIssued)}
          </p>
        </Card>
        <Card className="border-[--border-default] bg-[--bg-card] p-5">
          <p className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
            {t("summary.totalCollected")}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-[--status-success]">
            {formatMAD(summary.totalCollected)}
          </p>
        </Card>
        <Card className="border-[--border-default] bg-[--bg-card] p-5">
          <p className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
            {t("summary.remainingBalance")}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-[--status-error]">
            {formatMAD(summary.totalOutstanding)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">{t("filters.from")}</Label>
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            allowClear
            placeholder={tc("selectDate")}
            buttonClassName="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">{t("filters.to")}</Label>
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            allowClear
            placeholder={tc("selectDate")}
            buttonClassName="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">{t("filters.owner")}</Label>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("filters.all")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.all")}</SelectItem>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">{t("filters.category")}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Toutes" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={() => exportPayments(payments, exportCols, tc("export.sheetName"))}
          disabled={payments.length === 0}
        >
          <Download className="size-4" />
          {tc("export.button")}
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-[--border-default] bg-[--bg-card]">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[--border-subtle] hover:bg-transparent">
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.owner")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.charge")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.amount")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.date")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.method")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.reference")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[--text-muted]">
                  {tc("loading")}
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[--text-muted]">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow
                  key={p.id}
                  className="border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]"
                >
                  <TableCell className="text-[--text-primary]">
                    {p.ownerFirstName} {p.ownerLastName}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {p.chargeTitle}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {formatMAD(p.amount)}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {formatDate(p.paymentDate)}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {methodLabels[p.method] ?? p.method}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {p.reference}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
    </>
  );
}
