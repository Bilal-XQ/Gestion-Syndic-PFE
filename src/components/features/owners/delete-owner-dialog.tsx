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

import { deleteOwner } from "@/lib/actions/owners";

interface DeleteOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerId: string | null;
  ownerName: string;
}

export function DeleteOwnerDialog({
  open,
  onOpenChange,
  ownerId,
  ownerName,
}: DeleteOwnerDialogProps) {  const t = useTranslations("owners");
  const tc = useTranslations("common");  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ownerId) throw new Error("No owner ID");
      return deleteOwner(ownerId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("delete.success"));
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        queryClient.invalidateQueries({ queryKey: ["apartments"] });
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
            {t("delete.description", { ownerName: ownerName })}
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
