"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

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
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { ApartmentPanel } from "./apartment-panel";
import { DeleteApartmentDialog } from "./delete-apartment-dialog";

import { getApartments } from "@/lib/db/queries/apartments";

type Apartment = {
  id: string;
  unitNumber: string;
  floor: number;
  surfaceArea: string;
  roomCount: number;
  status: string;
  buildingId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

async function fetchApartments(): Promise<Apartment[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function ApartmentsTable({
  initialData,
  buildingId,
}: {
  initialData: Apartment[];
  buildingId: string;
}) {
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editApartment, setEditApartment] = useState<Apartment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteUnit, setDeleteUnit] = useState("");

  const { data: apartments = initialData } = useQuery<Apartment[]>({
    queryKey: ["apartments"],
    queryFn: fetchApartments,
    initialData,
  });

  const filtered = apartments.filter((a) =>
    a.unitNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[--text-muted]" />
          <Input
            placeholder="Rechercher par numéro…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditApartment(null);
            setPanelOpen(true);
          }}
        >
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      {/* Table */}
      <Card className="mt-4 overflow-hidden border-[--border-default] bg-[--bg-card]">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[--border-subtle] hover:bg-transparent">
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Numéro
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Étage
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Superficie
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Pièces
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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-[--text-muted]"
                >
                  Aucun appartement trouvé
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((apt) => (
                <TableRow
                  key={apt.id}
                  className="border-[--border-subtle] transition-colors duration-[150ms] hover:bg-[--bg-card-hover]"
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
                    <StatusBadge
                      status={apt.status as "occupied" | "vacant"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditApartment(apt);
                          setPanelOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
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
    </>
  );
}
