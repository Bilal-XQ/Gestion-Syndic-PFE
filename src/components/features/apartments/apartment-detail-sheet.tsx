"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { ApartmentTypeBadge } from "./apartment-type-badge";
import { formatMAD, formatDate } from "@/lib/formatters";
import type { ApartmentChargeDetail, ApartmentEnriched } from "@/types";

interface ApartmentDetailApiResponse {
  apartment: ApartmentEnriched;
  charges: ApartmentChargeDetail[];
  summary: {
    totalCharged: string;
    totalPaid: string;
    remaining: string;
  };
}

interface ApartmentDetailSheetProps {
  apartment: ApartmentEnriched | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApartmentDetailSheet({
  apartment,
  open,
  onOpenChange,
}: ApartmentDetailSheetProps) {
  const t = useTranslations("apartments");

  const { data, isLoading } = useQuery<ApartmentDetailApiResponse>({
    queryKey: ["apartment-detail", apartment?.id],
    queryFn: async () => {
      const res = await fetch(`/api/apartments/${apartment?.id}`);
      if (!res.ok) {
        throw new Error("Failed to load apartment detail");
      }
      return res.json();
    },
    enabled: open && !!apartment,
  });

  const charges = data?.charges ?? [];
  const summary = useMemo(
    () =>
      data?.summary ?? {
        totalCharged: "0",
        totalPaid: "0",
        remaining: "0",
      },
    [data]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("detail.title")}</SheetTitle>
          <SheetDescription>
            {apartment ? `${t("table.unitNumber")}: ${apartment.unitNumber}` : ""}
          </SheetDescription>
        </SheetHeader>

        {!apartment ? null : (
          <div className="space-y-5 px-4 pb-6">
            <section className="space-y-3 rounded-[12px] border border-[--border-default] bg-[--bg-card] p-4">
              <h3 className="text-sm font-semibold text-[--text-primary]">{t("detail.apartmentInfo")}</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[--text-muted]">{t("table.floor")}</p>
                  <p className="text-[--text-secondary]">{apartment.floor}</p>
                </div>
                <div>
                  <p className="text-[--text-muted]">{t("table.surfaceArea")}</p>
                  <p className="text-[--text-secondary]">{apartment.surfaceArea} m²</p>
                </div>
                <div>
                  <p className="text-[--text-muted]">{t("table.rooms")}</p>
                  <p className="text-[--text-secondary]">{apartment.roomCount}</p>
                </div>
                <div>
                  <p className="text-[--text-muted]">{t("table.type")}</p>
                  <ApartmentTypeBadge type={apartment.type} />
                </div>
                <div className="col-span-2">
                  <p className="text-[--text-muted]">{t("table.status")}</p>
                  <StatusBadge status={apartment.status} />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-[12px] border border-[--border-default] bg-[--bg-card] p-4">
              <h3 className="text-sm font-semibold text-[--text-primary]">{t("detail.ownerCardTitle")}</h3>
              {apartment.ownerName ? (
                <div className="space-y-1 text-sm">
                  <p className="text-[--text-secondary]">{apartment.ownerName}</p>
                  <p className="text-[--text-muted]">{apartment.ownerEmail ?? "—"}</p>
                  <p className="text-[--text-muted]">{apartment.ownerPhone ?? "—"}</p>
                </div>
              ) : (
                <p className="text-sm text-[--text-muted]">{t("detail.ownerNone")}</p>
              )}
            </section>

            <section className="space-y-3 rounded-[12px] border border-[--border-default] bg-[--bg-card] p-4">
              <h3 className="text-sm font-semibold text-[--text-primary]">{t("detail.chargesTitle")}</h3>
              {isLoading ? (
                <p className="text-sm text-[--text-muted]">...</p>
              ) : charges.length === 0 ? (
                <p className="text-sm text-[--text-muted]">{t("detail.chargesEmpty")}</p>
              ) : (
                <div className="space-y-2">
                  {charges.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between rounded-[10px] border border-[--border-subtle] bg-[--bg-elevated] px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-[--text-secondary]">{charge.title}</p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-xs text-[--text-muted]">
                          {formatMAD(charge.totalAmount)}
                        </p>
                      </div>
                      <Badge variant="outline">{charge.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2 rounded-[12px] border border-[--border-default] bg-[--bg-card] p-4">
              <h3 className="text-sm font-semibold text-[--text-primary]">{t("detail.paymentSummaryTitle")}</h3>
              <div className="space-y-1 text-sm text-[--text-secondary]">
                <p>{t("detail.totalCharged")}: {formatMAD(summary.totalCharged)}</p>
                <p>{t("detail.totalPaid")}: {formatMAD(summary.totalPaid)}</p>
                <p>{t("detail.remaining")}: {formatMAD(summary.remaining)}</p>
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}