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
import { deleteMeeting } from "@/lib/actions/meetings";

interface DeleteMeetingDialogProps {
  meetingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMeetingDialog({
  meetingId,
  open,
  onOpenChange,
}: DeleteMeetingDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!meetingId) return;
      return deleteMeeting(meetingId);
    },
    onSuccess: (result) => {
      if (result?.success) {
        toast.success("Réunion supprimée");
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        onOpenChange(false);
      } else if (result) {
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
            Supprimer la réunion ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[--text-secondary]">
            Cette action est irréversible. La réunion sera archivée et ne sera
            plus visible dans la liste.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-[--status-error] hover:bg-[--status-error]/80"
          >
            {mutation.isPending ? "Suppression…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
