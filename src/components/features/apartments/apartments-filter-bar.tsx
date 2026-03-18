"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApartmentEnriched } from "@/types";

interface FilterBarProps {
  apartments: ApartmentEnriched[];
  onFilter: (filtered: ApartmentEnriched[]) => void;
}

const typeOptions: ApartmentEnriched["type"][] = ["studio", "t1", "t2", "t3", "t4_plus"];

export function ApartmentsFilterBar({ apartments, onFilter }: FilterBarProps) {
  const t = useTranslations("apartments");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "occupied" | "vacant">("all");
  const [type, setType] = useState<"all" | ApartmentEnriched["type"]>("all");
  const [floor, setFloor] = useState<string>("all");

  const floors = useMemo(
    () =>
      [...new Set(apartments.map((a) => a.floor))]
        .sort((a, b) => a - b)
        .map(String),
    [apartments]
  );

  useEffect(() => {
    let result = [...apartments];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((a) => a.unitNumber.toLowerCase().includes(q));
    }

    if (status !== "all") {
      result = result.filter((a) => a.status === status);
    }

    if (type !== "all") {
      result = result.filter((a) => a.type === type);
    }

    if (floor !== "all") {
      result = result.filter((a) => String(a.floor) === floor);
    }

    onFilter(result);
  }, [apartments, floor, onFilter, search, status, type]);

  const inputClass =
    "h-auto min-w-[180px] rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const selectTriggerClass =
    "h-auto min-w-[160px] rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none transition-[border-color,box-shadow] duration-150 data-[placeholder]:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Input
        placeholder={t("filters.searchPlaceholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={inputClass}
      />

      <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder={t("filters.statusLabel")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.statusAll")}</SelectItem>
          <SelectItem value="occupied">{t("filters.statusOccupied")}</SelectItem>
          <SelectItem value="vacant">{t("filters.statusVacant")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder={t("filters.typeLabel")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.typeAll")}</SelectItem>
          {typeOptions.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {t(`types.${opt === "t4_plus" ? "t4Plus" : opt}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={floor} onValueChange={setFloor}>
        <SelectTrigger className={selectTriggerClass}>
          <SelectValue placeholder={t("filters.floorLabel")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.floorAll")}</SelectItem>
          {floors.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        onClick={() => {
          setSearch("");
          setStatus("all");
          setType("all");
          setFloor("all");
        }}
      >
        {t("filters.clear")}
      </Button>
    </div>
  );
}