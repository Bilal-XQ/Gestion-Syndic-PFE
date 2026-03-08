"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
}: DeleteChargeDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!chargeId) throw new Error("No charge ID");
      return deleteCharge(chargeId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Charge supprimée");
        queryClient.invalidateQueries({ queryKey: ["charges"] });
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-[--border-default] bg-[--bg-elevated]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[--text-primary]">
            Êtes-vous sûr ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[--text-secondary]">
            La charge <strong>{chargeTitle}</strong> sera archivée. Cette action
            est réversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            disabled={mutation.isPending}
            className="bg-[--status-error] text-white hover:bg-[--status-error]/90"
          >
            {mutation.isPending ? "Suppression…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
