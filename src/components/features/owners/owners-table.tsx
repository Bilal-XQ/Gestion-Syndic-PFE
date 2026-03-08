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
import type { getActiveOwners } from "@/lib/db/queries/owners";
import { OwnerPanel } from "./owner-panel";
import { DeleteOwnerDialog } from "./delete-owner-dialog";

type Owner = Awaited<ReturnType<typeof getActiveOwners>>[number];

async function fetchOwners(): Promise<Owner[]> {
  const res = await fetch("/api/owners");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function OwnersTable({ initialData }: { initialData: Owner[] }) {
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
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[--text-muted]" />
          <Input
            placeholder="Rechercher par nom ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            setEditOwner(null);
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
                Nom complet
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                E-mail
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Téléphone
              </TableHead>
              <TableHead className="text-xs font-normal uppercase tracking-[0.08em] text-[--text-muted]">
                Appartement
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
                  colSpan={5}
                  className="h-24 text-center text-[--text-muted]"
                >
                  Aucun copropriétaire trouvé
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
                  <TableCell className="text-right">
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
