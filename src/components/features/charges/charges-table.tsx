"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Search, MoreHorizontal, Trash2, Mail, Download } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { ChargePanel } from "./charge-panel";
import { DeleteChargeDialog } from "./delete-charge-dialog";

import { sendPaymentReminder, downloadPaymentNotice } from "@/lib/actions/charges";
import { formatDate, formatMAD } from "@/lib/formatters";
import { exportCharges, type ExportColumns } from "@/lib/export/excel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Charge = {
  id: string;
  syndicId: string;
  apartmentId: string;
  title: string;
  description: string | null;
  category: string;
  totalAmount: string;
  dueDate: string;
  lastReminderSentAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  amountPaid: string;
  remainingAmount: string;
  status: string;
  apartmentUnit: string | null;
};

type ApartmentOption = {
  id: string;
  unitNumber: string;
  floor: number;
  buildingId: string;
};

type BuildingOption = {
  id: string;
  name: string;
};

async function fetchCharges(): Promise<Charge[]> {
  const res = await fetch("/api/charges");
  if (!res.ok) throw new Error("Failed to fetch charges");
  return res.json();
}

async function fetchApartments(): Promise<ApartmentOption[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch apartments");
  return res.json();
}

async function fetchBuildings(): Promise<BuildingOption[]> {
  const res = await fetch("/api/immeubles");
  if (!res.ok) throw new Error("Failed to fetch buildings");
  return res.json();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// category labels are now built inside the component using translations

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChargesTable() {
  const t = useTranslations("charges");
  const tc = useTranslations("common");
  const exportCols: ExportColumns = {
    title: tc("export.columns.title"),
    apartment: tc("export.columns.apartment"),
    category: tc("export.columns.category"),
    totalAmount: tc("export.columns.totalAmount"),
    amountPaid: tc("export.columns.amountPaid"),
    remaining: tc("export.columns.remaining"),
    currency: tc("export.columns.currency"),
    dueDate: tc("export.columns.dueDate"),
    status: tc("export.columns.status"),
    fullName: "", email: "", phone: "", ownershipDate: "",
    ownerName: "", chargeTitle: "", amount: "",
    paymentDate: "", method: "", reference: "",
  };
  const categoryLabels: Record<string, string> = {
    electricity: tc("categories.electricity"),
    water: tc("categories.water"),
    maintenance: tc("categories.maintenance"),
    repair: tc("categories.repair"),
    other: tc("categories.other"),
  };
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: charges = [], isLoading } = useQuery<Charge[]>({
    queryKey: ["charges"],
    queryFn: fetchCharges,
  });
  const { data: apartments = [] } = useQuery<ApartmentOption[]>({
    queryKey: ["apartments"],
    queryFn: fetchApartments,
  });
  const { data: buildings = [] } = useQuery<BuildingOption[]>({
    queryKey: ["immeubles"],
    queryFn: fetchBuildings,
  });

  const filtered = charges.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.apartmentUnit ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // --- Actions ---
  async function handleSendReminder(chargeId: string) {
    const result = await sendPaymentReminder(chargeId);
    if (result.success) {
      toast.success(t("table.reminderSuccess"));
    } else {
      toast.error(result.error);
    }
  }

  async function handleDownloadPdf(chargeId: string) {
    const result = await downloadPaymentNotice(chargeId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    // Decode base64 and trigger browser download
    const bytes = Uint8Array.from(atob(result.data.buffer), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.data.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[--text-muted]" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportCharges(filtered, exportCols, tc("export.sheetName"))}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" />
            {tc("export.button")}
          </Button>
          <Button onClick={() => setPanelOpen(true)}>
            <Plus className="size-4" />
            {t("addButton")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden border-[--border-default] bg-[--bg-card]">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[--border-subtle] hover:bg-transparent">
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.title")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.apartment")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.category")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.total")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.paid")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.remaining")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.dueDate")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.status")}
              </TableHead>
              <TableHead className="text-end text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-[--text-muted]">
                  {tc("loading")}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-[--text-muted]">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((charge) => (
                <TableRow
                  key={charge.id}
                  className="border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]"
                >
                  <TableCell className="font-medium text-[--text-primary]">
                    {charge.title}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {charge.apartmentUnit ?? "–"}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {categoryLabels[charge.category] ?? charge.category}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {formatMAD(charge.totalAmount)}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {formatMAD(charge.amountPaid)}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {formatMAD(charge.remainingAmount)}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {formatDate(charge.dueDate)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={charge.status as "paid" | "partial" | "unpaid"}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Number(charge.remainingAmount) > 0 && (
                          <DropdownMenuItem onClick={() => handleSendReminder(charge.id)}>
                            <Mail className="me-2 size-4" />
                            {t("table.sendReminder")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDownloadPdf(charge.id)}>
                          <Download className="me-2 size-4" />
                          {t("table.downloadNotice")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget({ id: charge.id, title: charge.title })}
                          className="text-[--status-error] focus:text-[--status-error]"
                        >
                          <Trash2 className="me-2 size-4" />
                          {tc("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Add charge panel */}
      <ChargePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        apartments={apartments}
        buildings={buildings}
      />

      {/* Delete dialog */}
      <DeleteChargeDialog
        open={!!deleteTarget}
        onOpenChange={(v: boolean) => {
          if (!v) setDeleteTarget(null);
        }}
        chargeId={deleteTarget?.id ?? null}
        chargeTitle={deleteTarget?.title ?? ""}
      />
    </>
  );
}
