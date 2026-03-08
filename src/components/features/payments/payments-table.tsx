"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

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
import { Card } from "@/components/ui/card";

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
            Total charges
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-[--text-primary]">
            {Number(summary.totalChargesIssued).toFixed(2)} MAD
          </p>
        </Card>
        <Card className="border-[--border-default] bg-[--bg-card] p-5">
          <p className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
            Total encaissé
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-[--status-success]">
            {Number(summary.totalCollected).toFixed(2)} MAD
          </p>
        </Card>
        <Card className="border-[--border-default] bg-[--bg-card] p-5">
          <p className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
            Solde restant
          </p>
          <p className="mt-1 font-mono text-xl font-semibold text-[--status-error]">
            {Number(summary.totalOutstanding).toFixed(2)} MAD
          </p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">Du</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">Au</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">Propriétaire</Label>
          <Select value={ownerId} onValueChange={setOwnerId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-[--text-muted]">Catégorie</Label>
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[12px] border border-[--border-default] bg-[--bg-card]">
        <Table>
          <TableHeader>
            <TableRow className="border-[--border-subtle] hover:bg-transparent">
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Propriétaire
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Charge
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Montant
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Date
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Méthode
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Référence
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[--text-muted]">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-[--text-muted]">
                  Aucun paiement trouvé
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
                    {Number(p.amount).toFixed(2)} MAD
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {p.paymentDate}
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
    </>
  );
}
