"use client";

import { useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Loader2,
  AlertCircle,
  Zap,
  Droplets,
  Wrench,
  Hammer,
  MoreHorizontal,
} from "lucide-react";
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

type ApartmentOption = {
  id: string;
  unitNumber: string;
  floor: number;
  buildingId: string;
};

type BuildingOption = {
  id: string;
  name: string;
};

interface ChargePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartments: ApartmentOption[];
  buildings: BuildingOption[];
}

export function ChargePanel({
  open,
  onOpenChange,
  apartments,
  buildings,
}: ChargePanelProps) {
  const t = useTranslations("charges");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");

  const categoryOptions = [
    { value: "electricity", label: tc("categories.electricity"), Icon: Zap },
    { value: "water", label: tc("categories.water"), Icon: Droplets },
    { value: "maintenance", label: tc("categories.maintenance"), Icon: Wrench },
    { value: "repair", label: tc("categories.repair"), Icon: Hammer },
    { value: "other", label: tc("categories.other"), Icon: MoreHorizontal },
  ] as const;

  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ChargeFormValues, string>>
  >({});

  const form = useForm<ChargeFormValues>({
    defaultValues: {
      target: "apartment",
      title: "",
      description: "",
      category: "maintenance",
      totalAmount: undefined,
      dueDate: "",
      buildingId: buildings[0]?.id ?? "",
      apartmentId: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ChargeFormValues) => createCharge(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("panel.success"));
        queryClient.invalidateQueries({ queryKey: ["charges"] });
        onOpenChange(false);
        form.reset({
          target: "apartment",
          title: "",
          description: "",
          category: "maintenance",
          totalAmount: undefined,
          dueDate: "",
          buildingId: buildings[0]?.id ?? "",
          apartmentId: "",
        });
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
      setFieldErrors({});
      form.reset({
        target: "apartment",
        title: "",
        description: "",
        category: "maintenance",
        totalAmount: undefined,
        dueDate: "",
        buildingId: buildings[0]?.id ?? "",
        apartmentId: "",
      });
    }
    onOpenChange(v);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    setFieldErrors({});

    const values = form.getValues();
    const schema = createChargeSchema(tv);
    const result = schema.safeParse(values);

    if (!result.success) {
      const nextErrors: Partial<Record<keyof ChargeFormValues, string>> = {};
      const flat = result.error.flatten().fieldErrors;
      for (const [key, messages] of Object.entries(flat)) {
        if (messages && messages.length > 0) {
          nextErrors[key as keyof ChargeFormValues] = messages[0];
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    mutation.mutate(result.data);
  };

  const selectedTarget = form.watch("target");
  const selectedBuildingId = form.watch("buildingId");
  const apartmentsForBuilding = apartments.filter(
    (apt) => apt.buildingId === selectedBuildingId
  );

  const inputClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass = "text-[12px] font-medium text-[--text-secondary]";
  const selectTriggerClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none transition-[border-color,box-shadow] duration-150 data-[placeholder]:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)] modal-scroll">
        <div className="border-b border-[--border-default] px-7 pb-5 pt-7">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {t("panel.title")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {t("panel.description")}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-[18px] overflow-visible px-7 py-6">
            <div className="space-y-1.5">
              <label className={labelClass}>{t("panel.targetLabel")}</label>
              <Select
                value={selectedTarget}
                onValueChange={(val) => {
                  form.setValue("target", val as ChargeFormValues["target"]);
                  form.setValue("apartmentId", "");
                }}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">{t("panel.targetApartment")}</SelectItem>
                  <SelectItem value="building">{t("panel.targetBuilding")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t("panel.buildingLabel")}</label>
              <Select
                value={form.watch("buildingId")}
                onValueChange={(val) => {
                  form.setValue("buildingId", val, { shouldDirty: true });
                  form.setValue("apartmentId", "");
                }}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder={t("panel.buildingPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.buildingId && (
                <p className="mt-1 text-[12px] text-[#EF4444]">{fieldErrors.buildingId}</p>
              )}
            </div>

            {selectedTarget === "apartment" ? (
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
                  <SelectContent>
                    {apartmentsForBuilding.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.unitNumber} - {tc("floor")} {apt.floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.apartmentId && (
                  <p className="mt-1 text-[12px] text-[#EF4444]">{fieldErrors.apartmentId}</p>
                )}
              </div>
            ) : null}

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
              {fieldErrors.title && (
                <p className="mt-1 text-[12px] text-[#EF4444]">{fieldErrors.title}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className={labelClass}>
                {t("panel.descriptionLabel")}
              </label>
              <textarea
                id="description"
                placeholder={t("panel.descriptionPlaceholder")}
                className={`${inputClass} min-h-[72px] resize-none`}
                {...form.register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t("panel.categoryLabel")}</label>
              <Select
                value={form.watch("category")}
                onValueChange={(val) =>
                  form.setValue("category", val as ChargeFormValues["category"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue 
                    placeholder={t("panel.categoryPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.Icon className="size-4 text-[--text-muted]" />
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className="mt-1 text-[12px] text-[#EF4444]">{fieldErrors.category}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="totalAmount" className={labelClass}>
                {t("panel.amountLabel")}
              </label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min={0}
                placeholder="1500.00"
                className={inputClass}
                {...form.register("totalAmount", { valueAsNumber: true })}
              />
              {fieldErrors.totalAmount && (
                <p className="mt-1 text-[12px] text-[#EF4444]">{fieldErrors.totalAmount}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dueDate" className={labelClass}>
                {t("panel.dueDateLabel")}
              </label>
              <DatePicker
                value={form.watch("dueDate")}
                onChange={(value) =>
                  form.setValue("dueDate", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder={tc("selectDate")}
                buttonClassName={inputClass}
              />
              {fieldErrors.dueDate && (
                <p className="mt-1 text-[12px] text-[#EF4444]">{fieldErrors.dueDate}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[--border-subtle] px-7 pb-7 pt-5">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.08)] px-4 py-3">
                <AlertCircle className="mt-[1px] h-4 w-4 shrink-0 text-[#EF4444]" />
                <p className="text-[13px] leading-[1.5] text-[#EF4444]">{serverError}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full cursor-pointer items-center justify-center rounded-[10px] bg-[--btn-primary-bg] px-5 py-[13px] text-[14px] font-medium text-[--btn-primary-text] transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {mutation.isPending ? t("panel.submitting") : t("panel.submit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
