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
  const t = useTranslations("meetings");
  const tc = useTranslations("common");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!meetingId) return;
      return deleteMeeting(meetingId);
    },
    onSuccess: (result) => {
      if (result?.success) {
        toast.success(t("delete.success"));
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        onOpenChange(false);
      } else if (result) {
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
            {t("delete.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-[--status-error] hover:bg-[--status-error]/80"
          >
            {mutation.isPending ? t("delete.submitting") : t("delete.submit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
