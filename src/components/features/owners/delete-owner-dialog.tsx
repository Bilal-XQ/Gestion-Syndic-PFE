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
}: DeleteOwnerDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!ownerId) throw new Error("No owner ID");
      return deleteOwner(ownerId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Copropriétaire archivé");
        queryClient.invalidateQueries({ queryKey: ["owners"] });
        queryClient.invalidateQueries({ queryKey: ["apartments"] });
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
            Le copropriétaire <strong>{ownerName}</strong> sera archivé. Ses
            données financières seront conservées.
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
            {mutation.isPending ? "Archivage…" : "Archiver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
