"use client";

import { useState } from "react";
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

import { deleteApartment } from "@/lib/actions/apartments";

interface DeleteApartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string | null;
  unitNumber: string;
}

export function DeleteApartmentDialog({
  open,
  onOpenChange,
  apartmentId,
  unitNumber,
}: DeleteApartmentDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!apartmentId) throw new Error("No apartment ID");
      return deleteApartment(apartmentId);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Appartement supprimé");
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
            L&apos;appartement <strong>{unitNumber}</strong> sera archivé. Cette
            action est réversible.
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
