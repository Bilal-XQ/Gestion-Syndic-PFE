"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  createSettingsSchema,
  type SettingsFormValues,
} from "@/lib/validations/settings";
import { updateBuilding } from "@/lib/actions/settings";

interface SettingsFormProps {
  defaultValues: SettingsFormValues;
}

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(createSettingsSchema(tv)),
    defaultValues,
  });

  const mutation = useMutation({
    mutationFn: async (data: SettingsFormValues) => {
      return updateBuilding(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("form.success"));
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error(tc("errorOccurred"));
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
            {t("form.buildingLegend")}
          </legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("form.buildingNameLabel")}</Label>
            <Input
              id="name"
              placeholder={t("form.buildingNamePlaceholder")}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-[--status-error]">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">{t("form.addressLabel")}</Label>
            <Input
              id="address"
              placeholder={t("form.addressPlaceholder")}
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
            {t("form.contactLegend")}
          </legend>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone">{t("form.phoneLabel")}</Label>
            <Input
              id="contactPhone"
              type="tel"
              placeholder={t("form.phonePlaceholder")}
              {...form.register("contactPhone")}
            />
            {form.formState.errors.contactPhone && (
              <p className="text-xs text-[--status-error]">
                {form.formState.errors.contactPhone.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">{t("form.emailLabel")}</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder={t("form.emailPlaceholder")}
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
            {t("form.submit")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
