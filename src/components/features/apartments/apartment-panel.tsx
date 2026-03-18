"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
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

import {
  createApartmentSchema,
  type ApartmentFormValues,
} from "@/lib/validations/apartment";
import { createApartment, updateApartment } from "@/lib/actions/apartments";

type ApartmentType = ApartmentFormValues["type"];

interface ApartmentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: {
    id: string;
    unitNumber: string;
    floor: number;
    surfaceArea: string;
    roomCount: number;
    type?: ApartmentType;
  } | null;
}

export function ApartmentPanel({
  open,
  onOpenChange,
  apartment,
}: ApartmentPanelProps) {
  const t = useTranslations("apartments");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const isEdit = !!apartment;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ApartmentFormValues, string>>
  >({});

  const form = useForm<ApartmentFormValues>({
    defaultValues: {
      unitNumber: apartment?.unitNumber ?? "",
      floor: apartment?.floor,
      surfaceArea: apartment ? Number(apartment.surfaceArea) : undefined,
      roomCount: apartment?.roomCount,
      type: apartment?.type ?? "t2",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ApartmentFormValues) => {
      if (isEdit && apartment) {
        return updateApartment(apartment.id, data);
      }
      return createApartment(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          isEdit
            ? t("panel.updateSuccess")
            : t("panel.createSuccess")
        );
        queryClient.invalidateQueries({ queryKey: ["apartments"] });
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

  // Reset form when apartment prop changes
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setServerError("");
      setFieldErrors({});
      form.reset({
        unitNumber: apartment?.unitNumber ?? "",
        floor: apartment?.floor,
        surfaceArea: apartment ? Number(apartment.surfaceArea) : undefined,
        roomCount: apartment?.roomCount,
        type: apartment?.type ?? "t2",
      });
    }
    onOpenChange(v);
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setServerError("");

    const values = form.getValues();
    const schema = createApartmentSchema(tv);
    const result = schema.safeParse(values);

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      const mapped: Partial<Record<keyof ApartmentFormValues, string>> = {};
      for (const [key, msgs] of Object.entries(flat)) {
        if (msgs && msgs.length > 0) {
          mapped[key as keyof ApartmentFormValues] = msgs[0];
        }
      }
      setFieldErrors(mapped);
      return;
    }

    mutation.mutate(result.data);
  };

  const inputClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const selectTriggerClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none transition-[border-color,box-shadow] duration-150 data-[placeholder]:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass =
    "text-[12px] font-medium text-[--text-secondary]";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="my-4 w-full max-w-[560px] overflow-hidden rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)]">
        {/* HEADER */}
        <div className="border-b border-[--border-default] px-7 pt-7 pb-5">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {isEdit ? t("panel.editTitle") : t("panel.createTitle")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {isEdit
              ? t("panel.editDescription")
              : t("panel.createDescription")}
          </DialogDescription>
        </div>

        <form onSubmit={handleManualSubmit}>
          {/* BODY */}
          <div className="px-7 py-6 space-y-[18px] overflow-visible">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="unitNumber" className={labelClass}>
                  {t("panel.unitNumberLabel")}
                </label>
                <Input
                  id="unitNumber"
                  placeholder="A101"
                  className={inputClass}
                  {...form.register("unitNumber")}
                />
                {fieldErrors.unitNumber && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {fieldErrors.unitNumber}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="floor" className={labelClass}>
                  {t("panel.floorLabel")}
                </label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="0"
                  className={inputClass}
                  {...form.register("floor")}
                />
                {fieldErrors.floor && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {fieldErrors.floor}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="surfaceArea" className={labelClass}>
                  {t("panel.surfaceAreaLabel")}
                </label>
                <Input
                  id="surfaceArea"
                  type="number"
                  step="0.01"
                  placeholder="85"
                  className={inputClass}
                  {...form.register("surfaceArea")}
                />
                {fieldErrors.surfaceArea && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {fieldErrors.surfaceArea}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="roomCount" className={labelClass}>
                  {t("panel.roomCountLabel")}
                </label>
                <Input
                  id="roomCount"
                  type="number"
                  min={1}
                  placeholder="3"
                  className={inputClass}
                  {...form.register("roomCount")}
                />
                {fieldErrors.roomCount && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {fieldErrors.roomCount}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t("panel.typeLabel")}</label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) =>
                  form.setValue("type", v as ApartmentType)
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={t("panel.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(["studio", "t1", "t2", "t3", "t4_plus"] as const).map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${type === "t4_plus" ? "t4Plus" : type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.type && (
                <p className="text-[12px] text-[--status-error]">{fieldErrors.type}</p>
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
              {mutation.isPending
                ? t("panel.submitting")
                : isEdit
                  ? t("panel.updateButton")
                  : t("panel.createButton")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
