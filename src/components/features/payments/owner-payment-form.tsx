"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, AlertCircle, Building2, FileText, Wallet } from "lucide-react";

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

import { createPaymentSchema, type PaymentFormValues } from "@/lib/validations/payment";
import { createPayment } from "@/lib/actions/payments";
import { formatMAD } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Charge = {
  id: string;
  title: string;
  remainingAmount: string;
};

interface OwnerPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charge: Charge | null;
  ownerId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OwnerPaymentForm({
  open,
  onOpenChange,
  charge,
  ownerId,
}: OwnerPaymentFormProps) {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const methodOptions = [
    {
      value: "bank_transfer",
      label: tc("paymentMethods.transferFull"),
      icon: Building2,
    },
    {
      value: "check",
      label: tc("paymentMethods.check"),
      icon: FileText,
    },
    {
      value: "cash",
      label: tc("paymentMethods.cash"),
      icon: Wallet,
    },
  ];
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const form = useForm<PaymentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPaymentSchema(tv)) as any,
    defaultValues: {
      chargeId: charge?.id ?? "",
      ownerId: ownerId,
      amount: 0,
      paymentDate: new Date().toISOString().split("T")[0],
      method: "bank_transfer",
      reference: "",
      notes: "",
    },
  });

  // Reset form values when charge changes
  const handleOpenChange = (v: boolean) => {
    if (v && charge) {
      setServerError("");
      form.reset({
        chargeId: charge.id,
        ownerId: ownerId,
        amount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        method: "bank_transfer",
        reference: "",
        notes: "",
      });
    }
    onOpenChange(v);
  };

  // Sync hidden form fields (chargeId, ownerId) when the dialog opens.
  // The Dialog's onOpenChange is only called on user-driven close attempts;
  // when the parent sets open=true externally this effect fires instead.
  useEffect(() => {
    if (open && charge) {
      setServerError("");
      form.reset({
        chargeId: charge.id,
        ownerId: ownerId,
        amount: 0,
        paymentDate: new Date().toISOString().split("T")[0],
        method: "bank_transfer",
        reference: "",
        notes: "",
      });
    }
  }, [open, charge?.id, ownerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return createPayment(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("ownerForm.success"));
        queryClient.invalidateQueries({ queryKey: ["portal", "charges"] });
        queryClient.invalidateQueries({ queryKey: ["portal", "payments"] });
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

  const remaining = charge ? Number(charge.remainingAmount) : 0;

  const inputClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass =
    "text-[12px] font-medium text-[--text-secondary]";
  const selectTriggerClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none transition-[border-color,box-shadow] duration-150 data-[placeholder]:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="my-4 w-full max-w-[560px] overflow-hidden rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)]">
        {/* HEADER */}
        <div className="border-b border-[--border-default] px-7 pt-7 pb-5">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {t("ownerForm.title")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {charge
              ? `${charge.title} — ${t("ownerForm.descriptionWithCharge")} ${formatMAD(remaining)}`
              : t("ownerForm.descriptionNoCharge")}
          </DialogDescription>
        </div>

        <form
          onSubmit={form.handleSubmit(
            (data) => mutation.mutate(data),
            (errors) => {
              console.error("[PaymentForm] Validation errors:", errors);
            }
          )}
        >
          {/* Hidden registered fields — required for zodResolver to validate them */}
          <input type="hidden" {...form.register("chargeId")} />
          <input type="hidden" {...form.register("ownerId")} />

          {/* BODY */}
          <div className="px-7 py-6 space-y-[18px] overflow-visible">
            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="amount" className={labelClass}>
                {t("ownerForm.amountLabel", { max: formatMAD(remaining) })}
              </label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                className={inputClass}
                {...form.register("amount", { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            {/* Payment date */}
            <div className="space-y-1.5">
              <label htmlFor="paymentDate" className={labelClass}>
                {t("ownerForm.paymentDateLabel")}
              </label>
              <DatePicker
                value={form.watch("paymentDate")}
                onChange={(value) =>
                  form.setValue("paymentDate", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder={tc("selectDate")}
                buttonClassName={inputClass}
              />
              {form.formState.errors.paymentDate && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.paymentDate.message}
                </p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <label className={labelClass}>{t("ownerForm.methodLabel")}</label>
              <Select
                value={form.watch("method")}
                onValueChange={(v) =>
                  form.setValue("method", v as PaymentFormValues["method"])
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue>
                    {(() => {
                      const selected = methodOptions.find(
                        (o) => o.value === form.watch("method")
                      );
                      if (!selected) return null;
                      return (
                        <div className="flex items-center gap-2">
                          <selected.icon className="h-4 w-4 text-[--text-muted] shrink-0" />
                          <span>{selected.label}</span>
                        </div>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[--border-default] bg-popover text-popover-foreground shadow-[var(--shadow-md)]">
                  {methodOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[14px] focus:bg-[--bg-card-hover] focus:text-[--text-primary]"
                    >
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4 text-[--text-muted] shrink-0" />
                        <span>{opt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label htmlFor="reference" className={labelClass}>
                {t("ownerForm.referenceLabel")}
              </label>
              <Input
                id="reference"
                placeholder="REF-001"
                className={inputClass}
                {...form.register("reference")}
              />
              {form.formState.errors.reference && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.reference.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className={labelClass}>
                {t("ownerForm.notesLabel")}
              </label>
              <textarea
                id="notes"
                placeholder={t("ownerForm.notesPlaceholder")}
                className={`${inputClass} resize-none min-h-[80px]`}
                {...form.register("notes")}
              />
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
              {mutation.isPending ? t("ownerForm.submitting") : t("ownerForm.submit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

