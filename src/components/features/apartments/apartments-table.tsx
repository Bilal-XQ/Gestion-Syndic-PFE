"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Download } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { ApartmentTypeBadge } from "./apartment-type-badge";
import { ApartmentPanel } from "./apartment-panel";
import { DeleteApartmentDialog } from "./delete-apartment-dialog";
import { ApartmentStats } from "./apartments-stats";
import { ApartmentsFilterBar } from "./apartments-filter-bar";
import { ApartmentDetailSheet } from "./apartment-detail-sheet";
import { formatMAD } from "@/lib/formatters";
import { exportApartments } from "@/lib/export/excel";

import type { ApartmentEnriched } from "@/types";

async function fetchApartments(): Promise<ApartmentEnriched[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function ApartmentsTable({
  initialData,
  buildingId,
}: {
  initialData: ApartmentEnriched[];
  buildingId: string;
}) {
  const t = useTranslations("apartments");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editApartment, setEditApartment] = useState<ApartmentEnriched | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteUnit, setDeleteUnit] = useState("");
  const [filteredApartments, setFilteredApartments] = useState<ApartmentEnriched[]>(
    initialData
  );
  const [selectedApartment, setSelectedApartment] = useState<ApartmentEnriched | null>(
    null
  );

  const { data: apartments = initialData } = useQuery<ApartmentEnriched[]>({
    queryKey: ["apartments"],
    queryFn: fetchApartments,
    initialData,
  });

  useEffect(() => {
    setFilteredApartments(apartments);
  }, [apartments]);

  return (
    <>
      <ApartmentStats apartments={apartments} />

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <ApartmentsFilterBar
          apartments={apartments}
          onFilter={setFilteredApartments}
        />

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => exportApartments(filteredApartments, t)}>
            <Download className="size-4" />
            {t("export.button")}
          </Button>
          <Button
            onClick={() => {
              setEditApartment(null);
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
                {t("table.unitNumber")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.floor")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.surfaceArea")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.rooms")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.type")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.owner")}
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                {t("table.monthlyCharges")}
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
            {filteredApartments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-[--text-muted]"
                >
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              filteredApartments.map((apt) => (
                <TableRow
                  key={apt.id}
                  onClick={() => setSelectedApartment(apt)}
                  className="cursor-pointer border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]"
                >
                  <TableCell className="font-medium text-[--text-primary]">
                    {apt.unitNumber}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {apt.floor}
                  </TableCell>
                  <TableCell className="font-mono text-[--text-secondary]">
                    {apt.surfaceArea} m²
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {apt.roomCount}
                  </TableCell>
                  <TableCell>
                    <ApartmentTypeBadge type={apt.type} />
                  </TableCell>
                  <TableCell
                    className={
                      apt.ownerName
                        ? "text-[--text-secondary]"
                        : "text-[--text-muted]"
                    }
                  >
                    {apt.ownerName ?? t("table.vacantLabel")}
                  </TableCell>
                  <TableCell className="font-[family-name:var(--font-geist-mono)] text-[--text-secondary]">
                    {formatMAD(apt.totalActiveCharges)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={apt.status as "occupied" | "vacant"}
                    />
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditApartment(apt);
                          setPanelOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(apt.id);
                          setDeleteUnit(apt.unitNumber);
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
      <ApartmentPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        apartment={editApartment}
      />

      {/* Delete dialog */}
      <DeleteApartmentDialog
        open={!!deleteId}
        onOpenChange={(v) => {
          if (!v) setDeleteId(null);
        }}
        apartmentId={deleteId}
        unitNumber={deleteUnit}
      />

      <ApartmentDetailSheet
        apartment={selectedApartment}
        open={!!selectedApartment}
        onOpenChange={(open) => {
          if (!open) setSelectedApartment(null);
        }}
      />
    </>
  );
}
