"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  settingsSchema,
  type SettingsFormValues,
} from "@/lib/validations/settings";
import { updateBuilding } from "@/lib/actions/settings";

interface SettingsFormProps {
  defaultValues: SettingsFormValues;
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      return updateBuilding(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Paramètres mis à jour");
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue");
    },
  });

  return (
    <Card className="max-w-2xl rounded-[20px] border-[--border-subtle] bg-[--bg-card] p-6">
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="flex flex-col gap-5"
      >
        {/* Building info */}
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-[--text-primary]">
            Immeuble
          </legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nom de l&apos;immeuble</Label>
            <Input
              id="name"
              placeholder="Résidence les Oliviers"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-[--status-error]">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="12 Rue de la Paix, Casablanca"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-xs text-[--status-error]">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>
        </fieldset>

        <Separator />

        {/* Syndic contact info */}
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-sm font-medium text-[--text-primary]">
            Coordonnées du syndic
          </legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone">Téléphone</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="+212 6 00 00 00 00"
              {...form.register("contactPhone")}
            />
            {form.formState.errors.contactPhone && (
              <p className="text-xs text-[--status-error]">
                {form.formState.errors.contactPhone.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">E-mail de contact</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="syndic@example.com"
              {...form.register("contactEmail")}
            />
            {form.formState.errors.contactEmail && (
              <p className="text-xs text-[--status-error]">
                {form.formState.errors.contactEmail.message}
              </p>
            )}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-fit"
          >
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
}
