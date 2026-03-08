"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
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

import { chargeSchema, type ChargeFormValues } from "@/lib/validations/charge";
import { createCharge } from "@/lib/actions/charges";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Apartment = {
  id: string;
  unitNumber: string;
  floor: number;
};

async function fetchApartments(): Promise<Apartment[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch apartments");
  return res.json();
}

const categoryOptions = [
  { value: "electricity", label: "Électricité" },
  { value: "water", label: "Eau" },
  { value: "maintenance", label: "Entretien" },
  { value: "repair", label: "Réparation" },
  { value: "other", label: "Autre" },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ChargePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ChargePanel({ open, onOpenChange }: ChargePanelProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const { data: apartments = [] } = useQuery<Apartment[]>({
    queryKey: ["apartments"],
    queryFn: fetchApartments,
  });

  const form = useForm<ChargeFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(chargeSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "maintenance",
      totalAmount: 0,
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
        toast.success("Charge créée avec succès");
        queryClient.invalidateQueries({ queryKey: ["charges"] });
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

  const handleOpenChange = (v: boolean) => {
    if (v) {
      setServerError("");
      form.reset({
        title: "",
        description: "",
        category: "maintenance",
        totalAmount: 0,
        dueDate: "",
        apartmentId: "",
      });
    }
    onOpenChange(v);
  };

  const inputClass =
    "bg-[#141414] border border-[#2A2A2A] rounded-[10px] h-auto px-[14px] py-[10px] text-[14px] text-white placeholder:text-[#404040] shadow-none focus:border-[#555555] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] focus-visible:ring-0 focus-visible:outline-none transition-[border-color,box-shadow] duration-150 w-full";
  const labelClass =
    "text-[12px] font-medium text-[#A0A0A0] uppercase tracking-[0.06em]";
  const selectTriggerClass =
    "bg-[#141414] border border-[#2A2A2A] rounded-[10px] h-auto px-[14px] py-[10px] text-[14px] text-white shadow-none focus:border-[#555555] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] focus-visible:ring-0 focus-visible:outline-none transition-[border-color,box-shadow] duration-150 w-full";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[16px] max-w-[560px] w-full my-4 p-0 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] max-h-[calc(100vh-2rem)] overflow-y-auto modal-scroll">
        {/* HEADER */}
        <div className="px-7 pt-7 pb-5 border-b border-[#2A2A2A]">
          <DialogTitle className="text-[15px] font-semibold text-white tracking-[-0.01em]">
            Nouvelle charge
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#636363] mt-1 leading-[1.5]">
            Créez une charge pour un appartement.
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          {/* BODY */}
          <div className="px-7 py-6 space-y-[18px] overflow-visible">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className={labelClass}>
                Titre
              </label>
              <Input
                id="title"
                placeholder="Électricité Q1 2026"
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
                Description (optionnel)
              </label>
              <textarea
                id="description"
                placeholder="Détails de la charge…"
                className={`${inputClass} resize-none min-h-[72px]`}
                {...form.register("description")}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className={labelClass}>Catégorie</label>
              <Select
                value={form.watch("category")}
                onValueChange={(val) =>
                  form.setValue(
                    "category",
                    val as ChargeFormValues["category"],
                    { shouldValidate: true }
                  )
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {categoryOptions.map((opt) => (
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
              <Input
                id="dueDate"
                type="date"
                className={inputClass}
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.dueDate.message}
                </p>
              )}
            </div>

            {/* Apartment */}
            <div className="space-y-1.5">
              <label className={labelClass}>Appartement</label>
              <Select
                value={form.watch("apartmentId")}
                onValueChange={(val) =>
                  form.setValue("apartmentId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Choisir un appartement" />
                </SelectTrigger>
                <SelectContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  {apartments.map((apt) => (
                    <SelectItem
                      key={apt.id}
                      value={apt.id}
                      className="text-[14px] focus:bg-[#2A2A2A] focus:text-white"
                    >
                      {apt.unitNumber} — Étage {apt.floor}
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
              {mutation.isPending ? "Création…" : "Créer la charge"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

