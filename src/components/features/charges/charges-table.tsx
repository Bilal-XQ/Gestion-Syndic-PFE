"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

async function fetchCharges(): Promise<Charge[]> {
  const res = await fetch("/api/charges");
  if (!res.ok) throw new Error("Failed to fetch charges");
  return res.json();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const categoryLabels: Record<string, string> = {
  electricity: "Électricité",
  water: "Eau",
  maintenance: "Entretien",
  repair: "Réparation",
  other: "Autre",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChargesTable() {
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: charges = [], isLoading } = useQuery<Charge[]>({
    queryKey: ["charges"],
    queryFn: fetchCharges,
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
      toast.success("Rappel envoyé avec succès");
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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[--text-muted]" />
          <Input
            placeholder="Rechercher par titre ou appartement…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setPanelOpen(true)}>
          <Plus className="size-4" />
          Nouvelle charge
        </Button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-[12px] border border-[--border-default] bg-[--bg-card]">
        <Table>
          <TableHeader>
            <TableRow className="border-[--border-subtle] hover:bg-transparent">
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Titre
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Appartement
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Catégorie
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Total
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Payé
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Restant
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Échéance
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Statut
              </TableHead>
              <TableHead className="text-right text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-[--text-muted]">
                  Chargement…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-[--text-muted]">
                  Aucune charge trouvée
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
                    {Number(charge.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {Number(charge.amountPaid).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {Number(charge.remainingAmount).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {charge.dueDate}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={charge.status as "paid" | "partial" | "unpaid"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Number(charge.remainingAmount) > 0 && (
                          <DropdownMenuItem onClick={() => handleSendReminder(charge.id)}>
                            <Mail className="mr-2 size-4" />
                            Envoyer rappel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDownloadPdf(charge.id)}>
                          <Download className="mr-2 size-4" />
                          Télécharger avis
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget({ id: charge.id, title: charge.title })}
                          className="text-[--status-error] focus:text-[--status-error]"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Supprimer
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

      {/* Add charge panel */}
      <ChargePanel open={panelOpen} onOpenChange={setPanelOpen} />

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
