"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Calendar, Clock, FileText, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { respondToInvitation } from "@/lib/actions/notifications";
import { formatDateLong, formatTime } from "@/lib/formatters";
import type { OwnerMeetingRow } from "@/lib/db/queries/meetings";

async function fetchOwnerMeetings(): Promise<OwnerMeetingRow[]> {
  const res = await fetch("/api/portal/meetings");
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

function MeetingCard({
  meeting,
  readonly,
  onRespond,
  isPending,
  t,
}: {
  meeting: OwnerMeetingRow;
  readonly?: boolean;
  onRespond: (invitationId: string, response: "accepted" | "declined") => void;
  isPending: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const hasResponded =
    meeting.invitationStatus === "accepted" ||
    meeting.invitationStatus === "declined";

  return (
    <Card className="rounded-[--radius-xl] border-[--border-default] bg-[--bg-card]">
      <CardContent className="px-6 pb-5 pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[--text-primary]">
                {meeting.title}
              </h3>
              <StatusBadge
                status={
                  meeting.meetingStatus as
                    | "scheduled"
                    | "completed"
                    | "cancelled"
                }
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[--text-secondary]">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[--text-muted]" />
                <span className="capitalize">{formatDateLong(meeting.meetingDate)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[--text-muted]" />
                <span className="font-[family-name:var(--font-geist-mono)]">
                  {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[--text-muted]" />
                {meeting.location}
              </span>
            </div>

            {meeting.description ? (
              <div className="flex items-start gap-1.5 text-sm text-[--text-muted]">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p className="leading-relaxed">{meeting.description}</p>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 items-start gap-2 sm:items-end flex flex-col">
            {hasResponded ? (
              <Badge
                variant="outline"
                className={
                  meeting.invitationStatus === "accepted"
                    ? "border-[--status-success-border] bg-[--status-success-bg] text-[--status-success]"
                    : "border-[--border-default] bg-[--bg-elevated] text-[--text-muted]"
                }
              >
                {meeting.invitationStatus === "accepted"
                  ? t("ownerMeetings.status.accepted")
                  : t("ownerMeetings.status.declined")}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-[--border-default] bg-[--bg-elevated] text-[--text-muted]"
              >
                {t("ownerMeetings.status.invited")}
              </Badge>
            )}

            {!readonly && !hasResponded && meeting.meetingStatus === "scheduled" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => onRespond(meeting.invitationId, "accepted")}
                >
                  {t("ownerMeetings.actions.accept")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => onRespond(meeting.invitationId, "declined")}
                >
                  {t("ownerMeetings.actions.decline")}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MeetingsView() {
  const t = useTranslations("portal");
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["portal", "meetings"],
    queryFn: fetchOwnerMeetings,
  });

  const respondMutation = useMutation({
    mutationFn: ({
      invitationId,
      response,
    }: {
      invitationId: string;
      response: "accepted" | "declined";
    }) => respondToInvitation({ invitationId, response }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("ownerMeetings.responseSuccess"));
        queryClient.invalidateQueries({ queryKey: ["portal", "meetings"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error(t("ownerMeetings.responseError")),
  });

  const today = new Date().toISOString().split("T")[0];
  const { upcoming, past } = useMemo(() => {
    const upcomingRows: OwnerMeetingRow[] = [];
    const pastRows: OwnerMeetingRow[] = [];

    for (const meeting of meetings) {
      if (meeting.meetingDate >= today && meeting.meetingStatus === "scheduled") {
        upcomingRows.push(meeting);
      } else {
        pastRows.push(meeting);
      }
    }

    upcomingRows.sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));
    pastRows.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));

    return { upcoming: upcomingRows, past: pastRows };
  }, [meetings, today]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[--radius-xl]" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="upcoming">
      <TabsList>
        <TabsTrigger value="upcoming">
          {t("ownerMeetings.tabs.upcoming")}
          {upcoming.length > 0 ? (
            <span className="ms-2 rounded-full bg-[--accent-bg] px-2 py-0.5 text-[11px] font-medium text-[--accent]">
              {upcoming.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="past">{t("ownerMeetings.tabs.past")}</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4 space-y-3">
        {upcoming.length === 0 ? (
          <Card className="border-[--border-default] bg-[--bg-card]">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-[--text-muted]">
                {t("ownerMeetings.emptyUpcoming")}
              </p>
            </CardContent>
          </Card>
        ) : (
          upcoming.map((meeting) => (
            <MeetingCard
              key={meeting.invitationId}
              meeting={meeting}
              onRespond={(invitationId, response) =>
                respondMutation.mutate({ invitationId, response })
              }
              isPending={respondMutation.isPending}
              t={t}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4 space-y-3">
        {past.length === 0 ? (
          <Card className="border-[--border-default] bg-[--bg-card]">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-[--text-muted]">{t("ownerMeetings.emptyPast")}</p>
            </CardContent>
          </Card>
        ) : (
          past.map((meeting) => (
            <MeetingCard
              key={meeting.invitationId}
              meeting={meeting}
              readonly
              onRespond={(invitationId, response) =>
                respondMutation.mutate({ invitationId, response })
              }
              isPending={respondMutation.isPending}
              t={t}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
