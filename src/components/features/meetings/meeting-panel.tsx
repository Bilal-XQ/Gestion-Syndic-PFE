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
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

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
    "h-auto w-full rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] text-[--text-primary] shadow-none placeholder:text-[--text-placeholder] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)] focus-visible:ring-0 focus-visible:outline-none";
  const labelClass =
    "text-[12px] font-medium text-[--text-secondary]";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="my-4 max-h-[85vh] w-full max-w-[560px] overflow-y-auto rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)] modal-scroll">
        {/* HEADER */}
        <div className="border-b border-[--border-default] px-7 pt-7 pb-5">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            Nouvelle réunion
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
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
              <DatePicker
                value={form.watch("meetingDate")}
                onChange={(value) =>
                  form.setValue("meetingDate", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Choisir une date"
                buttonClassName={inputClass}
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
                <TimePicker
                  value={form.watch("startTime")}
                  onChange={(value) =>
                    form.setValue("startTime", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder="Choisir une heure"
                  buttonClassName={inputClass}
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
                <TimePicker
                  value={form.watch("endTime")}
                  onChange={(value) =>
                    form.setValue("endTime", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  placeholder="Choisir une heure"
                  buttonClassName={inputClass}
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
                          className="flex w-full items-center justify-between rounded-[10px] border border-[--border-default] bg-[--bg-input] px-[14px] py-[10px] text-[14px] transition-[border-color,box-shadow] duration-150 focus:border-[--border-focus] focus:ring-0 focus:outline-none focus:shadow-[0_0_0_3px_var(--glow-soft)]"
                        >
                          <span className={field.value.length > 0 ? "text-[--text-primary]" : "text-[--text-placeholder]"}>
                            {field.value.length > 0
                              ? `${field.value.length} sélectionné${field.value.length > 1 ? "s" : ""}`
                              : "Sélectionner des copropriétaires"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-[10px] border border-[--border-default] bg-popover p-0 text-popover-foreground shadow-[var(--shadow-md)]">
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
                                    className="text-[14px]"
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
                                    <span className="ml-auto text-xs text-[--text-muted]">
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
              {mutation.isPending ? "Création…" : "Créer la réunion"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

