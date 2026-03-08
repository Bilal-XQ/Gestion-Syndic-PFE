"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  markNotificationRead,
  markAllNotificationsRead,
  respondToInvitation,
} from "@/lib/actions/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function NotificationsList() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Toutes les notifications marquées comme lues");
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    },
  });

  const respondMutation = useMutation({
    mutationFn: respondToInvitation,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Réponse enregistrée");
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Une erreur est survenue"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[--text-secondary]">
          {unreadCount > 0
            ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
            : "Aucune notification non lue"}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-[--text-secondary]"
            disabled={markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <Card className="border-[--border-default] bg-[--bg-card]">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell className="h-8 w-8 text-[--text-muted]" />
            <p className="text-sm text-[--text-muted]">
              Aucune notification pour le moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => {
            const invitationId = (notif.metadata as Record<string, string>)
              ?.invitationId;
            const isMeetingInvitation = notif.type === "meeting_invitation";
            // Check if already responded (metadata.responded will be set
            // after action completes, but we infer from button disabling in mutation)
            const alreadyResponded =
              (notif.metadata as Record<string, unknown>)?.responded === true;

            return (
              <Card
                key={notif.id}
                className={`border-[--border-default] transition-colors ${
                  notif.isRead ? "bg-[--bg-card]" : "bg-[--bg-elevated]"
                }`}
              >
                <CardContent className="flex items-start gap-3 py-4">
                  {/* Read indicator */}
                  <button
                    type="button"
                    className="mt-1 shrink-0 rounded-[8px] p-2 hover:bg-[--bg-elevated]"
                    onClick={() => {
                      if (!notif.isRead) markReadMutation.mutate(notif.id);
                    }}
                    title={
                      notif.isRead ? "Déjà lu" : "Marquer comme lu"
                    }
                  >
                    {notif.isRead ? (
                      <MailOpen className="h-4 w-4 text-[--text-muted]" />
                    ) : (
                      <Mail className="h-4 w-4 text-[--accent-primary]" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${
                          notif.isRead
                            ? "text-[--text-secondary]"
                            : "text-[--text-primary]"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[--accent-primary] shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-[--text-muted] mt-0.5">
                      {notif.message}
                    </p>

                    {/* Meeting invitation actions */}
                    {isMeetingInvitation && invitationId && !alreadyResponded && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          disabled={respondMutation.isPending}
                          onClick={() =>
                            respondMutation.mutate({
                              invitationId,
                              response: "accepted",
                            })
                          }
                        >
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={respondMutation.isPending}
                          onClick={() =>
                            respondMutation.mutate({
                              invitationId,
                              response: "declined",
                            })
                          }
                        >
                          Décliner
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-[--text-muted] whitespace-nowrap">
                    {(() => {
                      try {
                        return formatDistanceToNow(
                          new Date(notif.createdAt),
                          { addSuffix: true, locale: fr }
                        );
                      } catch {
                        return "";
                      }
                    })()}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
