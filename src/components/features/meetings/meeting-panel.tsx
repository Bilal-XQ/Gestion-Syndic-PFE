"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown, X, Loader2, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  meetingSchema,
  type MeetingFormValues,
} from "@/lib/validations/meeting";
import { createMeeting } from "@/lib/actions/meetings";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Owner = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  unitNumber: string;
};

async function fetchOwners(): Promise<Owner[]> {
  const res = await fetch("/api/owners");
  if (!res.ok) throw new Error("Failed to fetch owners");
  return res.json();
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MeetingPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MeetingPanel({ open, onOpenChange }: MeetingPanelProps) {
  const queryClient = useQueryClient();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: owners = [] } = useQuery<Owner[]>({
    queryKey: ["owners"],
    queryFn: fetchOwners,
  });

  const form = useForm<MeetingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(meetingSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      meetingDate: "",
      startTime: "",
      endTime: "",
      location: "",
      ownerIds: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: MeetingFormValues) => {
      return createMeeting(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Réunion créée avec succès");
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
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
        meetingDate: "",
        startTime: "",
        endTime: "",
        location: "",
        ownerIds: [],
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
      <DialogContent className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-[16px] max-w-[560px] w-full my-4 p-0 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] max-h-[85vh] overflow-y-auto modal-scroll">
        {/* HEADER */}
        <div className="px-7 pt-7 pb-5 border-b border-[#2A2A2A]">
          <DialogTitle className="text-[15px] font-semibold text-white tracking-[-0.01em]">
            Nouvelle réunion
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#636363] mt-1 leading-[1.5]">
            Planifiez une assemblée générale et invitez des copropriétaires.
          </DialogDescription>
        </div>

        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
          {/* BODY */}
          <div className="px-7 pt-4 pb-6 space-y-[18px] overflow-visible">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className={labelClass}>
                Titre
              </label>
              <Input
                id="title"
                placeholder="Assemblée Générale Q2 2026"
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
                placeholder="Ordre du jour…"
                className={`${inputClass} resize-none min-h-[64px]`}
                {...form.register("description")}
              />
            </div>

            {/* Meeting date */}
            <div className="space-y-1.5">
              <label htmlFor="meetingDate" className={labelClass}>
                Date
              </label>
              <Input
                id="meetingDate"
                type="date"
                className={inputClass}
                {...form.register("meetingDate")}
              />
              {form.formState.errors.meetingDate && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.meetingDate.message}
                </p>
              )}
            </div>

            {/* Start / End times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="startTime" className={labelClass}>
                  Heure de début
                </label>
                <Input
                  id="startTime"
                  type="time"
                  className={inputClass}
                  {...form.register("startTime")}
                />
                {form.formState.errors.startTime && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.startTime.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="endTime" className={labelClass}>
                  Heure de fin
                </label>
                <Input
                  id="endTime"
                  type="time"
                  className={inputClass}
                  {...form.register("endTime")}
                />
                {form.formState.errors.endTime && (
                  <p className="text-[12px] text-[#EF4444] mt-1">
                    {form.formState.errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label htmlFor="location" className={labelClass}>
                Lieu
              </label>
              <Input
                id="location"
                placeholder="Salle de réunion"
                className={inputClass}
                {...form.register("location")}
              />
              {form.formState.errors.location && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>

            {/* Owner multi-select */}
            <div className="space-y-1.5">
              <label className={labelClass}>Copropriétaires à inviter</label>
              <Controller
                control={form.control}
                name="ownerIds"
                render={({ field }) => (
                  <>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded={popoverOpen}
                          className="bg-[#141414] border border-[#2A2A2A] rounded-[10px] px-[14px] py-[10px] text-[14px] focus:border-[#555555] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_rgba(255,255,255,0.06)] transition-[border-color,box-shadow] duration-150 w-full flex items-center justify-between"
                        >
                          <span className={field.value.length > 0 ? "text-white" : "text-[#404040]"}>
                            {field.value.length > 0
                              ? `${field.value.length} sélectionné${field.value.length > 1 ? "s" : ""}`
                              : "Sélectionner des copropriétaires"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#1F1F1F] border border-[#2A2A2A] rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                        <Command>
                          <CommandInput placeholder="Rechercher…" />
                          <CommandList>
                            <CommandEmpty>Aucun résultat</CommandEmpty>
                            <CommandGroup>
                              {owners.map((owner) => {
                                const selected = field.value.includes(owner.id);
                                return (
                                  <CommandItem
                                    key={owner.id}
                                    value={`${owner.firstName} ${owner.lastName}`}
                                    onSelect={() => {
                                      const next = selected
                                        ? field.value.filter(
                                            (id) => id !== owner.id
                                          )
                                        : [...field.value, owner.id];
                                      field.onChange(next);
                                    }}
                                    className="text-[14px] focus:bg-[#2A2A2A] focus:text-white"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selected
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <span>
                                      {owner.firstName} {owner.lastName}
                                    </span>
                                    <span className="ml-auto text-xs text-[#636363]">
                                      {owner.unitNumber}
                                    </span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected owners as badges */}
                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map((id) => {
                          const owner = owners.find((o) => o.id === id);
                          if (!owner) return null;
                          return (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {owner.firstName} {owner.lastName}
                              <button
                                type="button"
                                className="ml-1 rounded-full outline-none hover:text-[#EF4444]"
                                onClick={() =>
                                  field.onChange(
                                    field.value.filter((v) => v !== id)
                                  )
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              />
              {form.formState.errors.ownerIds && (
                <p className="text-[12px] text-[#EF4444] mt-1">
                  {form.formState.errors.ownerIds.message}
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
              {mutation.isPending ? "Création…" : "Créer la réunion"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

