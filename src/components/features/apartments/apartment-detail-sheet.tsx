"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
  onEdit: (apartment: ApartmentEnriched) => void;
}

export function ApartmentDetailSheet({
  apartment,
  open,
  onOpenChange,
  onEdit,
}: ApartmentDetailSheetProps) {
  const t = useTranslations("apartments");
  const tc = useTranslations("common");

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="my-4 w-full max-w-[760px] overflow-hidden rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)]">
        <div className="border-b border-[--border-default] px-7 pb-5 pt-7">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {t("detail.title")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {apartment ? `${t("table.unitNumber")}: ${apartment.unitNumber}` : ""}
          </DialogDescription>
        </div>

        {!apartment ? null : (
          <>
            <div className="max-h-[calc(100dvh-280px)] space-y-5 overflow-y-auto px-7 py-6">
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
                  <div>
                    <p className="text-[--text-muted]">{t("detail.tantiemes")}</p>
                    <p className="text-[--text-secondary]">
                      {apartment.tantiemes} / {apartment.buildingTotalTantiemes}
                    </p>
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

            <div className="border-t border-[--border-subtle] px-7 pb-7 pt-5">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onEdit(apartment);
                  }}
                  className="inline-flex items-center justify-center rounded-[10px] bg-[--btn-primary-bg] px-4 py-2 text-sm font-medium text-[--btn-primary-text] transition-all duration-150 hover:opacity-90"
                >
                  {tc("edit")}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center justify-center rounded-[10px] border border-[--border-default] bg-[--bg-card] px-4 py-2 text-sm font-medium text-[--text-secondary] transition-all duration-150 hover:bg-[--bg-card-hover] hover:text-[--text-primary]"
                >
                  {tc("cancel")}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}