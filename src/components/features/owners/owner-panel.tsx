"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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

import { ownerSchema, type OwnerFormValues } from "@/lib/validations/owner";
import { createOwner, updateOwner } from "@/lib/actions/owners";
import type { getActiveOwners } from "@/lib/db/queries/owners";
import { toDateInputValue } from "@/lib/formatters";

type ApartmentOption = {
  id: string;
  unitNumber: string;
  status: string;
};

type Owner = Awaited<ReturnType<typeof getActiveOwners>>[number];

interface OwnerPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner?: Owner | null;
}

async function fetchVacantApartments(): Promise<ApartmentOption[]> {
  const res = await fetch("/api/apartments?status=vacant");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchAllApartments(): Promise<ApartmentOption[]> {
  const res = await fetch("/api/apartments");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function OwnerPanel({ open, onOpenChange, owner }: OwnerPanelProps) {
  const isEdit = !!owner;
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      firstName: owner?.firstName ?? "",
      lastName: owner?.lastName ?? "",
      email: owner?.email ?? "",
      phone: owner?.phone ?? "",
      apartmentId: owner?.apartmentId ?? "",
      ownershipDate: toDateInputValue(owner?.ownershipDate),
    },
  });

  // In edit mode: show all apartments (owner's current + vacant ones)
  // In create mode: show only vacant apartments
  const { data: apartmentOptions = [] } = useQuery<ApartmentOption[]>({
    queryKey: isEdit ? ["apartments"] : ["apartments", "vacant"],
    queryFn: isEdit ? fetchAllApartments : fetchVacantApartments,
  });

  // Reset form when owner changes
  useEffect(() => {
    if (open) {
      setServerError("");
      form.reset({
        firstName: owner?.firstName ?? "",
        lastName: owner?.lastName ?? "",
        email: owner?.email ?? "",
        phone: owner?.phone ?? "",
        apartmentId: owner?.apartmentId ?? "",
        ownershipDate: toDateInputValue(owner?.ownershipDate),
      });
    }
  }, [open, owner]);

  const mutation = useMutation({
    mutationFn: async (data: OwnerFormValues) => {
      if (isEdit && owner) {
        return updateOwner(owner.id, data);
      }
      return createOwner(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(
          isEdit
            ? "Copropriétaire mis à jour"
            : "Copropriétaire créé avec succès"
        );
        queryClient.invalidateQueries({ queryKey: ["owners"] });
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

  const inputClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass =
    "text-[12px] font-medium text-[--text-secondary]";
  const selectTriggerClass =
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none transition-[border-color,box-shadow] duration-150 data-[placeholder]:text-[--text-placeholder] focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)] modal-scroll">
        {/* HEADER */}
        <div className="border-b border-[--border-default] px-7 pt-7 pb-5">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {isEdit ? "Modifier le copropriétaire" : "Ajouter un copropriétaire"}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {isEdit
              ? "Modifiez les informations du copropriétaire."
              : "Remplissez les informations du nouveau copropriétaire."}
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          {/* BODY */}
          <div className="px-7 pt-4 pb-6 space-y-[18px] overflow-visible">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className={labelClass}>
                  Prénom
                </label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  className={inputClass}
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className={labelClass}>
                  Nom
                </label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  className={inputClass}
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className={labelClass}>
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jean@exemple.fr"
                disabled={isEdit}
                className={inputClass}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className={labelClass}>
                Téléphone
              </label>
              <Input
                id="phone"
                placeholder="+212 6XX XXX XXX"
                className={inputClass}
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Appartement</label>
              <Select
                value={form.watch("apartmentId")}
                onValueChange={(value) =>
                  form.setValue("apartmentId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue placeholder="Sélectionner un appartement" />
                </SelectTrigger>
                <SelectContent className="rounded-[10px] border border-[--border-default] bg-popover text-popover-foreground shadow-[var(--shadow-md)]">
                  {apartmentOptions.map((apt) => (
                    <SelectItem
                      key={apt.id}
                      value={apt.id}
                      className="text-[14px] focus:bg-[--bg-card-hover] focus:text-[--text-primary]"
                    >
                      {apt.unitNumber}
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

            <div className="space-y-1.5">
              <label htmlFor="ownershipDate" className={labelClass}>
                Date de propriété
              </label>
              <DatePicker
                value={form.watch("ownershipDate")}
                onChange={(value) =>
                  form.setValue("ownershipDate", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Choisir une date"
                buttonClassName={inputClass}
              />
              {form.formState.errors.ownershipDate && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.ownershipDate.message}
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

