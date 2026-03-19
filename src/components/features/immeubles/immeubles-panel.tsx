"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createBuilding, updateBuilding } from "@/lib/actions/immeubles";
import { createImmeubleSchema, type ImmeubleFormValues } from "@/lib/validations/immeuble";
import type { BuildingWithStats } from "@/lib/db/queries/buildings";

interface ImmeublesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  building: BuildingWithStats | null;
}

export function ImmeublesPanel({
  open,
  onOpenChange,
  mode,
  building,
}: ImmeublesPanelProps) {
  const t = useTranslations("immeubles");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const queryClient = useQueryClient();

  const [form, setForm] = useState<ImmeubleFormValues>({
    name: "",
    address: "",
    totalTantiemes: 1000,
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ImmeubleFormValues, string>>
  >({});
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) {
      setServerError("");
      return;
    }

    if (mode === "edit" && building) {
      setForm({
        name: building.name,
        address: building.address,
        totalTantiemes: building.totalTantiemes,
      });
    } else {
      setForm({
        name: "",
        address: "",
        totalTantiemes: 1000,
      });
    }
    setFieldErrors({});
    setServerError("");
  }, [open, mode, building]);

  const mutation = useMutation({
    mutationFn: async (payload: ImmeubleFormValues) => {
      if (mode === "edit" && building) {
        return updateBuilding(building.id, payload);
      }
      return createBuilding(payload);
    },
    onSuccess: (result) => {
      if (!result.success) {
        setServerError(result.error);
        toast.error(result.error);
        return;
      }
      setServerError("");
      toast.success(mode === "edit" ? t("panel.updateSuccess") : t("panel.createSuccess"));
      queryClient.invalidateQueries({ queryKey: ["immeubles"] });
      onOpenChange(false);
    },
    onError: () => {
      setServerError(tc("errorOccurred"));
      toast.error(tc("errorOccurred"));
    },
  });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    const schema = createImmeubleSchema(tv);
    const parsed = schema.safeParse(form);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ImmeubleFormValues, string>> = {};
      const flat = parsed.error.flatten().fieldErrors;

      for (const [key, messages] of Object.entries(flat)) {
        if (messages && messages.length > 0) {
          nextErrors[key as keyof ImmeubleFormValues] = messages[0];
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="my-4 w-full max-w-[520px] overflow-hidden rounded-[16px] border border-[--border-default] bg-background p-0 shadow-[var(--shadow-hero-card)]">
        <div className="border-b border-[--border-default] px-7 pb-5 pt-7">
          <DialogTitle className="text-[15px] font-semibold text-[--text-primary] tracking-[-0.01em]">
            {mode === "create" ? t("panel.createTitle") : t("panel.editTitle")}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[13px] leading-[1.5] text-[--text-muted]">
            {t("panel.description")}
          </DialogDescription>
        </div>

        <form onSubmit={onSubmit}>
          <div className="max-h-[calc(100dvh-280px)] space-y-[18px] overflow-y-auto px-7 py-6">
            <div className="space-y-1.5">
              <label className="text-sm text-[--text-secondary]">{t("panel.nameLabel")}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t("panel.namePlaceholder")}
              />
              {fieldErrors.name ? (
                <p className="text-xs text-[--status-error]">{fieldErrors.name}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-[--text-secondary]">{t("panel.addressLabel")}</label>
              <Input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder={t("panel.addressPlaceholder")}
              />
              {fieldErrors.address ? (
                <p className="text-xs text-[--status-error]">{fieldErrors.address}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-[--text-secondary]">{t("panel.totalTantièmesLabel")}</label>
              <Input
                type="number"
                min={1}
                value={form.totalTantiemes}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    totalTantiemes: Number(e.target.value) || 0,
                  }))
                }
                placeholder={t("panel.totalTantièmesPlaceholder")}
              />
              <p className="text-xs text-[--text-muted]">{t("panel.totalTantièmesHelper")}</p>
              {fieldErrors.totalTantiemes ? (
                <p className="text-xs text-[--status-error]">{fieldErrors.totalTantiemes}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[--border-subtle] px-7 pb-7 pt-5">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-[10px] border border-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.08)] px-4 py-3">
                <AlertCircle className="mt-[1px] h-4 w-4 shrink-0 text-[#EF4444]" />
                <p className="text-[13px] leading-[1.5] text-[#EF4444]">{serverError}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full items-center justify-center rounded-[10px] bg-[--btn-primary-bg] px-5 py-[13px] text-[14px] font-medium text-[--btn-primary-text] transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {mutation.isPending
                ? t("panel.submitting")
                : mode === "create"
                  ? t("panel.createButton")
                  : t("panel.updateButton")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
