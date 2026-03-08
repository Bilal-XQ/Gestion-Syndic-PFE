"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
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
  apartmentSchema,
  type ApartmentFormValues,
} from "@/lib/validations/apartment";
import { createApartment, updateApartment } from "@/lib/actions/apartments";

interface ApartmentPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: {
    id: string;
    unitNumber: string;
    floor: number;
    surfaceArea: string;
    roomCount: number;
  } | null;
}

export function ApartmentPanel({
  open,
  onOpenChange,
  apartment,
}: ApartmentPanelProps) {
  const isEdit = !!apartment;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const form = useForm<ApartmentFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(apartmentSchema) as any,
    defaultValues: {
      unitNumber: apartment?.unitNumber ?? "",
      floor: apartment?.floor,
      surfaceArea: apartment ? Number(apartment.surfaceArea) : undefined,
      roomCount: apartment?.roomCount,
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
            ? "Appartement mis à jour"
            : "Appartement créé avec succès"
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
      setServerError("Une erreur est survenue");
      toast.error("Une erreur est survenue");
    },
  });

  // Reset form when apartment prop changes
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setServerError("");
      form.reset({
        unitNumber: apartment?.unitNumber ?? "",
        floor: apartment?.floor,
        surfaceArea: apartment ? Number(apartment.surfaceArea) : undefined,
        roomCount: apartment?.roomCount,
      });
    }
    onOpenChange(v);
  };

  const inputClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass =
    "text-[12px] font-medium text-[--text-secondary]";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="my-4 w-full max-w-[560px] overflow-hidden rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)]">
        {/* HEADER */}
        <div className="border-b border-[--border-default] px-7 pt-7 pb-5">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {isEdit ? "Modifier l'appartement" : "Ajouter un appartement"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {isEdit
              ? "Modifiez les informations de l'appartement."
              : "Remplissez les informations du nouvel appartement."}
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          {/* BODY */}
          <div className="px-7 py-6 space-y-[18px] overflow-visible">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="unitNumber" className={labelClass}>
                  Numéro
                </label>
                <Input
                  id="unitNumber"
                  placeholder="A101"
                  className={inputClass}
                  {...form.register("unitNumber")}
                />
                {form.formState.errors.unitNumber && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.unitNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="floor" className={labelClass}>
                  Étage
                </label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="0"
                  className={inputClass}
                  {...form.register("floor")}
                />
                {form.formState.errors.floor && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.floor.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="surfaceArea" className={labelClass}>
                  Superficie (m²)
                </label>
                <Input
                  id="surfaceArea"
                  type="number"
                  step="0.01"
                  placeholder="85"
                  className={inputClass}
                  {...form.register("surfaceArea")}
                />
                {form.formState.errors.surfaceArea && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.surfaceArea.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="roomCount" className={labelClass}>
                  Nombre de pièces
                </label>
                <Input
                  id="roomCount"
                  type="number"
                  min={1}
                  placeholder="3"
                  className={inputClass}
                  {...form.register("roomCount")}
                />
                {form.formState.errors.roomCount && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.roomCount.message}
                  </p>
                )}
              </div>
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
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {mutation.isPending
                ? "Enregistrement…"
                : isEdit
                  ? "Mettre à jour"
                  : "Créer"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
