"use client";

import { useTranslations } from "next-intl";
import type { ApartmentEnriched } from "@/types";

interface ApartmentStatsProps {
  apartments: ApartmentEnriched[];
}

export function ApartmentStats({ apartments }: ApartmentStatsProps) {
  const t = useTranslations("apartments");

  const total = apartments.length;
  const occupied = apartments.filter((a) => a.status === "occupied").length;
  const vacant = total - occupied;
  const occupiedPct = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const vacantPct = total > 0 ? 100 - occupiedPct : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] px-5 py-4">
        <p className="mb-1 font-[family-name:var(--font-syne)] text-[11px] font-medium uppercase tracking-widest text-[--text-muted]">
          {t("stats.total")}
        </p>
        <p className="font-[family-name:var(--font-geist-mono)] text-[22px] font-semibold text-[--text-primary]">
          {total}
        </p>
      </div>

      <div className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] px-5 py-4">
        <p className="mb-1 font-[family-name:var(--font-syne)] text-[11px] font-medium uppercase tracking-widest text-[--text-muted]">
          {t("stats.occupied")}
        </p>
        <p className="font-[family-name:var(--font-geist-mono)] text-[22px] font-semibold text-[--status-success]">
          {occupied}
          <span className="ms-2 text-[13px] text-[--text-muted]">({occupiedPct}%)</span>
        </p>
      </div>

      <div className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] px-5 py-4">
        <p className="mb-1 font-[family-name:var(--font-syne)] text-[11px] font-medium uppercase tracking-widest text-[--text-muted]">
          {t("stats.vacant")}
        </p>
        <p className="font-[family-name:var(--font-geist-mono)] text-[22px] font-semibold text-[--status-warning]">
          {vacant}
          <span className="ms-2 text-[13px] text-[--text-muted]">({vacantPct}%)</span>
        </p>
      </div>

      <div className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] px-5 py-4">
        <p className="mb-2 font-[family-name:var(--font-syne)] text-[11px] font-medium uppercase tracking-widest text-[--text-muted]">
          {t("stats.occupancyRate")}
        </p>
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[--bg-subtle]">
          <div
            className="h-full rounded-full bg-[--accent] transition-all duration-300"
            style={{ width: `${occupiedPct}%` }}
          />
        </div>
        <p className="font-[family-name:var(--font-geist-mono)] text-[18px] font-semibold text-[--accent]">
          {occupiedPct}%
        </p>
      </div>
    </div>
  );
}