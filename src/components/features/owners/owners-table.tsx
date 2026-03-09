"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";

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
import type { getActiveOwners } from "@/lib/db/queries/owners";
import { OwnerPanel } from "./owner-panel";
import { DeleteOwnerDialog } from "./delete-owner-dialog";
import { exportOwners, type ExportColumns } from "@/lib/export/excel";

type Owner = Awaited<ReturnType<typeof getActiveOwners>>[number];

async function fetchOwners(): Promise<Owner[]> {
  const res = await fetch("/api/owners");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function OwnersTable({ initialData }: { initialData: Owner[] }) {
  const t = useTranslations("owners");
  const tc = useTranslations("common");
  const exportCols: ExportColumns = {
    fullName: tc("export.columns.fullName"),
    email: tc("export.columns.email"),
    phone: tc("export.columns.phone"),
    apartment: tc("export.columns.apartment"),
    ownershipDate: tc("export.columns.ownershipDate"),
    title: "", category: "", totalAmount: "", amountPaid: "",
    remaining: "", dueDate: "", status: "", currency: "",
    ownerName: "", chargeTitle: "", amount: "",
    paymentDate: "", method: "", reference: "",
  };
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editOwner, setEditOwner] = useState<Owner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const { data: owners = initialData } = useQuery<Owner[]>({
    queryKey: ["owners"],
    queryFn: fetchOwners,
    initialData,
  });

  const filtered = owners.filter((o) => {
    const q = search.toLowerCase();
    const fullName = `${o.firstName} ${o.lastName}`.toLowerCase();
    return fullName.includes(q) || o.email.toLowerCase().includes(q);
  });

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
            onClick={() => exportOwners(filtered, exportCols, tc("export.sheetName"))}
            disabled={filtered.length === 0}
          >
            <Download className="size-4" />
            {tc("export.button")}
          </Button>
          <Button
            onClick={() => {
              setEditOwner(null);
              setPanelOpen(true);
            }}
          >
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
                {t("table.fullName")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.email")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.phone")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.apartment")}
              </TableHead>
              <TableHead className="text-end text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-[--text-muted]"
                >
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((owner) => (
                <TableRow
                  key={owner.id}
                  className="border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]"
                >
                  <TableCell className="font-medium text-[--text-primary]">
                    {owner.firstName} {owner.lastName}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {owner.email}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {owner.phone || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {owner.unitNumber}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditOwner(owner);
                          setPanelOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteId(owner.id);
                          setDeleteName(
                            `${owner.firstName} ${owner.lastName}`
                          );
                        }}
                      >
                        <Trash2 className="size-3.5 text-[--status-error]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Panel */}
      <OwnerPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        owner={editOwner}
      />

      {/* Delete dialog */}
      <DeleteOwnerDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
        ownerId={deleteId}
        ownerName={deleteName}
      />
    </>
  );
}
