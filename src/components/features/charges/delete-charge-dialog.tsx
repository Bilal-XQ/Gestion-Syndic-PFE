"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteCharge } from "@/lib/actions/charges";

interface DeleteChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargeId: string | null;
  chargeTitle: string;
}

export function DeleteChargeDialog({
  open,
  onOpenChange,
  chargeId,
  chargeTitle,
}: DeleteChargeDialogProps) {  const t = useTranslations("charges");
  const tc = useTranslations("common");  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!chargeId) throw new Error("No charge ID");
      return deleteCharge(chargeId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("delete.success"));
        queryClient.invalidateQueries({ queryKey: ["charges"] });
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error(tc("errorOccurred"));
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[--border-default] bg-[--bg-elevated]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[--text-primary]">
            {t("delete.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[--text-secondary]">
            {t("delete.description", { chargeTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="bg-[--status-error] text-white hover:bg-[--status-error]/90"
          >
            {mutation.isPending ? t("delete.submitting") : t("delete.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
