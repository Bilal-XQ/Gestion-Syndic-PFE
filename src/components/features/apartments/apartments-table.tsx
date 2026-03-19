"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, Download, Building2, ChevronDown } from "lucide-react";

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
import { cn } from "@/lib/utils";

import type { ApartmentEnriched } from "@/types";
import type { BuildingWithStats } from "@/lib/db/queries/buildings";

async function fetchApartments(): Promise<ApartmentEnriched[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function ApartmentsTable({
  initialData,
  buildings,
}: {
  initialData: ApartmentEnriched[];
  buildings: BuildingWithStats[];
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
  const [openByBuilding, setOpenByBuilding] = useState<Record<string, boolean>>({});

  const { data: apartments = initialData } = useQuery<ApartmentEnriched[]>({
    queryKey: ["apartments"],
    queryFn: fetchApartments,
    initialData,
  });

  useEffect(() => {
    setFilteredApartments(apartments);
  }, [apartments]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const apt of apartments) {
      next[apt.buildingId] = true;
    }
    setOpenByBuilding(next);
  }, [apartments]);

  const grouped = filteredApartments.reduce((acc, apt) => {
    if (!acc[apt.buildingId]) acc[apt.buildingId] = [];
    acc[apt.buildingId].push(apt);
    return acc;
  }, {} as Record<string, ApartmentEnriched[]>);

  const buildingEntries = Object.entries(grouped).sort(([, aptsA], [, aptsB]) => {
    const nameA = aptsA[0]?.buildingName ?? "";
    const nameB = aptsB[0]?.buildingName ?? "";
    return nameA.localeCompare(nameB);
  });

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

      {buildingEntries.length === 0 ? (
        <Card className="mt-4 rounded-[16px] border-[--border-default] bg-[--bg-card] p-6 text-center text-[--text-muted]">
          {t("table.empty")}
        </Card>
      ) : (
        <div className="mt-4 space-y-4">
          {buildingEntries.map(([buildingId, apts]) => {
            const buildingName = apts[0]?.buildingName ?? "";
            const occupied = apts.filter((a) => a.status === "occupied").length;
            const occupancyPct = apts.length > 0 ? Math.round((occupied / apts.length) * 100) : 0;
            const isOpen = openByBuilding[buildingId] ?? true;

            return (
              <Card key={buildingId} className="overflow-hidden border-[--border-default] bg-[--bg-card]">
                <div className="border-b border-[--border-subtle] px-4 py-3">
                  <button
                    onClick={() =>
                      setOpenByBuilding((prev) => ({
                        ...prev,
                        [buildingId]: !isOpen,
                      }))
                    }
                    className="flex items-center gap-2 text-[13px] font-semibold text-[--text-secondary] transition-colors duration-150 hover:text-[--text-primary]"
                  >
                    <Building2 className="h-4 w-4 text-[--accent]" />
                    {buildingName}
                    <span className="font-normal text-[--text-muted]">
                      - {apts.length} appt · {occupancyPct}% occupes
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                </div>

                {isOpen ? (
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
                            {t("table.tantiemes")}
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
                        {apts.map((apt) => (
                          <TableRow
                            key={apt.id}
                            onClick={() => setSelectedApartment(apt)}
                            className="cursor-pointer border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]"
                          >
                            <TableCell className="font-medium text-[--text-primary]">
                              {apt.unitNumber}
                            </TableCell>
                            <TableCell className="text-[--text-secondary]">{apt.floor}</TableCell>
                            <TableCell className="font-mono text-[--text-secondary]">
                              {apt.surfaceArea} m²
                            </TableCell>
                            <TableCell className="text-[--text-secondary]">{apt.roomCount}</TableCell>
                            <TableCell>
                              <ApartmentTypeBadge type={apt.type} />
                            </TableCell>
                            <TableCell>
                              <span className="font-[family-name:var(--font-geist-mono)] text-[13px] text-[--text-secondary]">
                                {apt.tantiemes} / {apt.buildingTotalTantiemes}
                              </span>
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
                              <StatusBadge status={apt.status as "occupied" | "vacant"} />
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {/* Panel */}
      <ApartmentPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        apartment={editApartment}
        buildings={buildings.map((building) => ({
          id: building.id,
          name: building.name,
          totalTantiemes: building.totalTantiemes,
        }))}
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
        onEdit={(apartment) => {
          setSelectedApartment(null);
          setEditApartment(apartment);
          setPanelOpen(true);
        }}
      />
    </>
  );
}
