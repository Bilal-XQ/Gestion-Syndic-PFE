"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  Bell,
  CheckCheck,
  Mail,
  CheckCircle,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { arSA } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  markNotificationRead,
  markAllNotificationsRead,
  respondToInvitation,
} from "@/lib/actions/notifications";

type NotificationText = {
  title: string;
  message: string;
};

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
  invitationStatus: string | null;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const notificationIcons: Record<string, React.ElementType> = {
  meeting_invitation: Mail,
  payment_confirmation: CheckCircle,
  payment_reminder: AlertCircle,
  payment_notice: Bell,
};

function formatNotificationMessage(message: string): string {
  return message.replace(
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    (_, isoDate) => formatDate(isoDate)
  );
}

function resolveNotificationText(
  notif: Notification,
  t: ReturnType<typeof useTranslations>
): NotificationText {
  const metadata = (notif.metadata as Record<string, unknown> | null) ?? null;

  if (notif.type === "payment_notice") {
    return {
      title: t("items.paymentNotice.title"),
      message: t("items.paymentNotice.message"),
    };
  }

  if (notif.type === "payment_confirmation") {
    return {
      title: t("items.paymentConfirmation.title"),
      message: t("items.paymentConfirmation.message"),
    };
  }

  if (notif.type === "payment_reminder") {
    return {
      title: t("items.paymentReminder.title"),
      message: t("items.paymentReminder.message"),
    };
  }

  if (notif.type === "meeting_invitation") {
    const meetingTitle =
      typeof metadata?.meetingTitle === "string"
        ? metadata.meetingTitle
        : undefined;
    const meetingDate =
      typeof metadata?.meetingDate === "string"
        ? metadata.meetingDate
        : undefined;

    if (meetingTitle && meetingDate) {
      return {
        title: t("items.meetingInvitation.title"),
        message: t("items.meetingInvitation.message", {
          meetingTitle,
          meetingDate: formatDate(meetingDate),
        }),
      };
    }

    return {
      title: t("items.meetingInvitation.title"),
      message: t("items.meetingInvitation.messageGeneric"),
    };
  }

  return {
    title: notif.title,
    message: formatNotificationMessage(notif.message),
  };
}

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
  const t = useTranslations("notifications");
  const locale = useLocale();
  const dateFnsLocale = locale === "ar" ? arSA : locale === "en" ? enUS : fr;

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
        toast.success(t("markAllReadSuccess"));
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ invitationId, response }: { invitationId: string; response: "accepted" | "declined" }) =>
      respondToInvitation({ invitationId, response }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("responseSuccess"));
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error(t("responseError")),
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
        {unreadCount === 0
          ? t("unreadCount_zero")
          : unreadCount === 1
            ? t("unreadCount_one", { count: unreadCount })
            : t("unreadCount_other", { count: unreadCount })}
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
            {t("markAllRead")}
          </Button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <Card className="border-[--border-default] bg-[--bg-card]">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell className="h-8 w-8 text-[--text-muted]" />
            <p className="text-sm text-[--text-muted]">
              {t("empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => {
            const invitationId = (notif.metadata as Record<string, string>)
              ?.invitationId;
            const isMeetingInvitation = notif.type === "meeting_invitation";
            const hasResponded =
              notif.invitationStatus === "accepted" ||
              notif.invitationStatus === "declined";
            const text = resolveNotificationText(notif, t);

            const Icon = notificationIcons[notif.type] ?? Bell;

            return (
              <Card
                key={notif.id}
                className={cn(
                  "transition-colors",
                  !notif.isRead
                    ? "border-s-2 border-[--accent-primary] bg-[--bg-elevated]"
                    : "border-[--border-default] bg-[--bg-card]"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Type icon */}
                      <div className="shrink-0 mt-0.5">
                        <Icon
                          className={cn(
                            "size-4",
                            notif.type === "payment_confirmation" &&
                              "text-[--status-success]",
                            notif.type === "payment_reminder" &&
                              "text-[--status-warning]",
                            (notif.type === "meeting_invitation" ||
                              notif.type === "payment_notice") &&
                              "text-[--text-secondary]"
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "text-sm font-medium",
                              notif.isRead
                                ? "text-[--text-secondary]"
                                : "text-[--text-primary]"
                            )}
                          >
                            {text.title}
                          </p>
                        </div>
                        <p className="text-sm text-[--text-muted] mt-0.5">
                          {text.message}
                        </p>

                        {/* Meeting invitation actions */}
                        {isMeetingInvitation && invitationId && !hasResponded && (
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
                              {t("accept")}
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
                              {t("decline")}
                            </Button>
                          </div>
                        )}

                        {/* Response status badge */}
                        {isMeetingInvitation && hasResponded && (
                          <div className="flex items-center gap-2 mt-2">
                            {notif.invitationStatus === "accepted" ? (
                              <Badge
                                variant="outline"
                                className="text-[--status-success] border-[--status-success-border] bg-[--status-success-bg] gap-1.5"
                              >
                                <Check className="size-3" />
                                {t("statusAccepted")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[--text-muted] border-[--border-default] bg-[--bg-elevated] gap-1.5"
                              >
                                <X className="size-3" />
                                {t("statusDeclined")}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timestamp + unread dot */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!notif.isRead && (
                        <span className="size-2 rounded-full bg-[--accent-primary] mt-1" />
                      )}
                      <span className="text-xs text-[--text-muted] whitespace-nowrap">
                        {(() => {
                          try {
                            return formatDistanceToNow(
                              new Date(notif.createdAt),
                              { addSuffix: true, locale: dateFnsLocale }
                            );
                          } catch {
                            return "";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
