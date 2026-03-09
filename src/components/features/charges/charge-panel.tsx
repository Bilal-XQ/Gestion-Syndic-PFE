"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

import { createChargeSchema, type ChargeFormValues } from "@/lib/validations/charge";
import { createCharge } from "@/lib/actions/charges";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Apartment = {
  id: string;
  unitNumber: string;
  floor: number;
};

interface ChargePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function fetchApartments(): Promise<Apartment[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch apartments");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChargePanel({ open, onOpenChange }: ChargePanelProps) {
  const t = useTranslations("charges");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const categoryOptions = [
    { value: "electricity", label: tc("categories.electricity") },
    { value: "water", label: tc("categories.water") },
    { value: "maintenance", label: tc("categories.maintenance") },
    { value: "repair", label: tc("categories.repair") },
    { value: "other", label: tc("categories.other") },
  ];
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const { data: apartments = [] } = useQuery<Apartment[]>({
    queryKey: ["apartments"],
    queryFn: fetchApartments,
  });

  const form = useForm<ChargeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createChargeSchema(tv)) as any,
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      apartmentId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ChargeFormValues) => {
      return createCharge(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("panel.success"));
        queryClient.invalidateQueries({ queryKey: ["charges"] });
        onOpenChange(false);
        form.reset();
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    },
    onError: () => {
      setServerError(tc("errorOccurred"));
      toast.error(tc("errorOccurred"));
    },
  });

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setServerError("");
      form.reset({
        title: "",
        description: "",
        dueDate: "",
        apartmentId: "",
      });
    }
    onOpenChange(v);
  };

  const inputClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass =
    "text-[12px] font-medium text-[--text-secondary]";
  const selectTriggerClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none transition-[border-color,box-shadow] duration-150 data-[placeholder]:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)] modal-scroll">
        {/* HEADER */}
        <div className="border-b border-[--border-default] px-7 pt-7 pb-5">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {t("panel.title")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {t("panel.description")}
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          {/* BODY */}
          <div className="px-7 py-6 space-y-[18px] overflow-visible">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className={labelClass}>
                {t("panel.titleLabel")}
              </label>
              <Input
                id="title"
                placeholder={t("panel.titlePlaceholder")}
                className={inputClass}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className={labelClass}>
                {t("panel.descriptionLabel")}
              </label>
              <textarea
                id="description"
                placeholder={t("panel.descriptionPlaceholder")}
                className={`${inputClass} resize-none min-h-[72px]`}
                {...form.register("description")}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className={labelClass}>{t("panel.categoryLabel")}</label>
              <Select
                value={form.watch("category") ?? ""}
                onValueChange={(val) =>
                  form.setValue(
                    "category",
                    val as ChargeFormValues["category"],
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={t("panel.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[--border-default] bg-popover text-popover-foreground shadow-[var(--shadow-md)]">
                  <SelectItem value="placeholder" disabled>
                    {t("panel.categoryPlaceholder")}
                  </SelectItem>
                  {categoryOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[14px] focus:bg-[--bg-card-hover] focus:text-[--text-primary]"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            {/* Total amount */}
            <div className="space-y-1.5">
              <label htmlFor="totalAmount" className={labelClass}>
                Montant total (MAD)
              </label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="1500.00"
                className={inputClass}
                {...form.register("totalAmount")}
              />
              {form.formState.errors.totalAmount && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.totalAmount.message}
                </p>
              )}
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <label htmlFor="dueDate" className={labelClass}>
                Date d&apos;échéance
              </label>
              <DatePicker
                value={form.watch("dueDate")}
                onChange={(value) =>
                  form.setValue("dueDate", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Choisir une date"
                buttonClassName={inputClass}
              />
              {form.formState.errors.dueDate && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.dueDate.message}
                </p>
              )}
            </div>

            {/* Apartment */}
            <div className="space-y-1.5">
              <label className={labelClass}>{t("panel.apartmentLabel")}</label>
              <Select
                value={form.watch("apartmentId")}
                onValueChange={(val) =>
                  form.setValue("apartmentId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={t("panel.apartmentPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[--border-default] bg-popover text-popover-foreground shadow-[var(--shadow-md)]">
                  {apartments.map((apt) => (
                    <SelectItem
                      key={apt.id}
                      value={apt.id}
                      className="text-[14px] focus:bg-[--bg-card-hover] focus:text-[--text-primary]"
                    >
                      {apt.unitNumber} — {tc("floor")} {apt.floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.apartmentId && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.apartmentId.message}
                </p>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="flex flex-col gap-2 border-t border-[--border-subtle] px-7 pb-7 pt-5">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] px-4 py-3">
                <AlertCircle className="w-4 h-4 text-[#EF4444] mt-[1px] shrink-0" />
                <p className="text-[13px] text-[#EF4444] leading-[1.5]">{serverError}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center rounded-[10px] bg-[--btn-primary-bg] px-5 py-[13px] text-[14px] font-medium text-[--btn-primary-text] transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {mutation.isPending ? t("panel.submitting") : t("panel.submit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

