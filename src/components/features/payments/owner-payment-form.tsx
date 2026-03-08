"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

import { paymentSchema, type PaymentFormValues } from "@/lib/validations/payment";
import { createPayment } from "@/lib/actions/payments";

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

const methodOptions = [
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "check", label: "Chèque" },
  { value: "cash", label: "Espèces" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function OwnerPaymentForm({
  open,
  onOpenChange,
  charge,
  ownerId,
}: OwnerPaymentFormProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const form = useForm<PaymentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(paymentSchema) as any,
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

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      return createPayment(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Paiement enregistré avec succès");
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
      setServerError("Une erreur est survenue");
      toast.error("Une erreur est survenue");
    },
  });

  const remaining = charge ? Number(charge.remainingAmount) : 0;

  const inputClass =
    "bg-[#141414] border border-[#2A2A2A] rounded-[10px] h-auto px-[14px] py-[10px] text-[14px] text-white placeholder:text-[#404040] shadow-none focus:border-[#555555] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] focus-visible:ring-0 focus-visible:outline-none transition-[border-color,box-shadow] duration-150 w-full";
  const labelClass =
    "text-[12px] font-medium text-[#A0A0A0] uppercase tracking-[0.06em]";
  const selectTriggerClass =
    "bg-[#141414] border border-[#2A2A2A] rounded-[10px] h-auto px-[14px] py-[10px] text-[14px] text-white shadow-none focus:border-[#555555] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] focus-visible:ring-0 focus-visible:outline-none transition-[border-color,box-shadow] duration-150 w-full";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[16px] max-w-[560px] w-full my-4 p-0 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        {/* HEADER */}
        <div className="px-7 pt-7 pb-5 border-b border-[#2A2A2A]">
          <DialogTitle className="text-[15px] font-semibold text-white tracking-[-0.01em]">
            Effectuer un paiement
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#636363] mt-1 leading-[1.5]">
            {charge
              ? `${charge.title} — Solde restant : ${remaining.toFixed(2)} MAD`
              : "Sélectionnez une charge"}
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>

          {/* BODY */}
          <div className="px-7 py-6 space-y-[18px] overflow-visible">
            {/* Amount */}
            <div className="space-y-1.5">
              <label htmlFor="amount" className={labelClass}>
                Montant (max {remaining.toFixed(2)} MAD)
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
                Date de paiement
              </label>
              <Input
                id="paymentDate"
                type="date"
                className={inputClass}
                {...form.register("paymentDate")}
              />
              {form.formState.errors.paymentDate && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.paymentDate.message}
                </p>
              )}
            </div>

            {/* Method */}
            <div className="space-y-1.5">
              <label className={labelClass}>Méthode de paiement</label>
              <Select
                value={form.watch("method")}
                onValueChange={(v) =>
                  form.setValue("method", v as PaymentFormValues["method"])
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {methodOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-[14px] focus:bg-[#2A2A2A] focus:text-white"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label htmlFor="reference" className={labelClass}>
                Référence
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
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                placeholder="Détails supplémentaires…"
                className={`${inputClass} resize-none min-h-[80px]`}
                {...form.register("notes")}
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="px-7 pb-7 pt-5 border-t border-[#1E1E1E] flex flex-col gap-2">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] px-4 py-3">
                <AlertCircle className="w-4 h-4 text-[#EF4444] mt-[1px] shrink-0" />
                <p className="text-[13px] text-[#EF4444] leading-[1.5]">{serverError}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-white text-[#0A0A0A] hover:bg-white/90 active:scale-[0.98] rounded-[10px] px-5 py-[13px] text-[14px] font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {mutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {mutation.isPending ? "Enregistrement…" : "Enregistrer le paiement"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

