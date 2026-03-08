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
      floor: apartment?.floor ?? 0,
      surfaceArea: apartment ? Number(apartment.surfaceArea) : 0,
      roomCount: apartment?.roomCount ?? 1,
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
        floor: apartment?.floor ?? 0,
        surfaceArea: apartment ? Number(apartment.surfaceArea) : 0,
        roomCount: apartment?.roomCount ?? 1,
      });
    }
    onOpenChange(v);
  };

  const inputClass =
    "bg-[#141414] border border-[#2A2A2A] rounded-[10px] h-auto px-[14px] py-[10px] text-[14px] text-white placeholder:text-[#404040] shadow-none focus:border-[#555555] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] focus-visible:ring-0 focus-visible:outline-none transition-[border-color,box-shadow] duration-150 w-full";
  const labelClass =
    "text-[12px] font-medium text-[#A0A0A0] uppercase tracking-[0.06em]";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[16px] max-w-[560px] w-full my-4 p-0 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        {/* HEADER */}
        <div className="px-7 pt-7 pb-5 border-b border-[#2A2A2A]">
          <DialogTitle className="text-[15px] font-semibold text-white tracking-[-0.01em]">
            {isEdit ? "Modifier l'appartement" : "Ajouter un appartement"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#636363] mt-1 leading-[1.5]">
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
