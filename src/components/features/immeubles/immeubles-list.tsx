"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Building2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImmeublesPanel } from "./immeubles-panel";
import type { BuildingWithStats } from "@/lib/db/queries/buildings";

async function fetchImmeubles(): Promise<BuildingWithStats[]> {
  const res = await fetch("/api/immeubles");
  if (!res.ok) throw new Error("Failed to fetch buildings");
  return res.json();
}

export function ImmeublesList({
  initialData,
}: {
  initialData: BuildingWithStats[];
}) {
  const t = useTranslations("immeubles");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BuildingWithStats | null>(null);

  const { data: buildings = initialData } = useQuery<BuildingWithStats[]>({
    queryKey: ["immeubles"],
    queryFn: fetchImmeubles,
    initialData,
  });

  const rows = useMemo(
    () =>
      buildings.map((building) => {
        const occupancyPct =
          building.apartmentCount > 0
            ? Math.round((building.occupiedCount / building.apartmentCount) * 100)
            : 0;
        return { ...building, occupancyPct };
      }),
    [buildings]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Building2 className="size-4" />
          {t("addButton")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card className="rounded-[16px] border-[--border-default] bg-[--bg-card] p-6 text-[--text-muted]">
          {t("empty")}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((building) => (
            <Card
              key={building.id}
              className="rounded-[16px] border-[--border-default] bg-[--bg-card] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-[--text-primary]">
                    {building.name}
                  </h3>
                  <p className="mt-1 text-sm text-[--text-secondary]">
                    {building.address}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditing(building);
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-1 text-sm text-[--text-secondary]">
                <p>
                  {t("table.totalApartments")}: {building.apartmentCount}
                </p>
                <p>
                  {t("table.occupancyRate")}: {building.occupancyPct}%
                </p>
                <p>
                  {t("table.totalTantiemes")}: {building.totalTantiemes}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ImmeublesPanel
        open={open}
        onOpenChange={setOpen}
        mode={editing ? "edit" : "create"}
        building={editing}
      />
    </div>
  );
}
