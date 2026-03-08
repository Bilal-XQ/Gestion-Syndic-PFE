"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { cancelMeeting } from "@/lib/actions/meetings";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type MeetingDetail = {
  meeting: {
    id: string;
    syndicId: string;
    title: string;
    description: string | null;
    meetingDate: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    createdAt: string;
    totalInvitations: number;
    acceptedCount: number;
    declinedCount: number;
  };
  invitations: {
    id: string;
    ownerId: string;
    status: string;
    respondedAt: string | null;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
  }[];
};

async function fetchMeetingDetail(id: string): Promise<MeetingDetail> {
  const res = await fetch(`/api/meetings/${id}`);
  if (!res.ok) throw new Error("Failed to fetch meeting");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MeetingDetail({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["meetings", meetingId],
    queryFn: () => fetchMeetingDetail(meetingId),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => cancelMeeting(meetingId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Réunion annulée");
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
      } else {
        toast.error(result.error);
      }
    },
    onError: () => toast.error("Une erreur est survenue"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-[--text-secondary]">
        Impossible de charger les détails de la réunion.
      </div>
    );
  }

  const { meeting, invitations } = data;

  const formattedDate = (() => {
    try {
      return format(new Date(meeting.meetingDate), "EEEE d MMMM yyyy", {
        locale: fr,
      });
    } catch {
      return meeting.meetingDate;
    }
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-2 text-[--text-secondary]"
        onClick={() => router.push("/dashboard/meetings")}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux réunions
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-[--text-primary]">
            {meeting.title}
          </h2>
          <StatusBadge
            status={meeting.status as "scheduled" | "completed" | "cancelled"}
          />
        </div>
        {meeting.status === "scheduled" && (
          <Button
            variant="outline"
            size="sm"
            className="text-[--status-error] border-[--status-error]"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? "Annulation…" : "Annuler la réunion"}
          </Button>
        )}
      </div>

      {/* Info card */}
      <Card className="border-[--border-default] bg-[--bg-card]">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 text-[--text-muted]" />
            <div>
              <p className="text-xs text-[--text-muted]">Date</p>
              <p className="text-sm font-medium text-[--text-primary] capitalize">
                {formattedDate}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 text-[--text-muted]" />
            <div>
              <p className="text-xs text-[--text-muted]">Horaire</p>
              <p className="text-sm font-medium font-mono text-[--text-primary]">
                {meeting.startTime} – {meeting.endTime}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-[--text-muted]" />
            <div>
              <p className="text-xs text-[--text-muted]">Lieu</p>
              <p className="text-sm font-medium text-[--text-primary]">
                {meeting.location}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-4 w-4 text-[--text-muted]" />
            <div>
              <p className="text-xs text-[--text-muted]">Participants</p>
              <p className="text-sm font-medium text-[--text-primary]">
                {meeting.acceptedCount}/{meeting.totalInvitations} confirmés
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description (if exists) */}
      {meeting.description && (
        <Card className="border-[--border-default] bg-[--bg-card]">
          <CardHeader>
            <CardTitle className="text-sm text-[--text-secondary]">
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[--text-primary] whitespace-pre-wrap">
              {meeting.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attendees table */}
      <Card className="border-[--border-default] bg-[--bg-card]">
        <CardHeader>
          <CardTitle className="text-sm text-[--text-secondary]">
            Invitations ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[--border-default]">
                <TableHead className="text-[--text-muted]">Nom</TableHead>
                <TableHead className="text-[--text-muted]">Email</TableHead>
                <TableHead className="text-[--text-muted]">Statut</TableHead>
                <TableHead className="text-[--text-muted]">
                  Répondu le
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-[--text-muted] py-8"
                  >
                    Aucune invitation
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((inv) => (
                  <TableRow
                    key={inv.id}
                    className="border-[--border-default]"
                  >
                    <TableCell className="text-[--text-primary] font-medium">
                      {inv.ownerFirstName} {inv.ownerLastName}
                    </TableCell>
                    <TableCell className="text-[--text-secondary]">
                      {inv.ownerEmail}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          inv.status as "invited" | "accepted" | "declined"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-[--text-muted] font-mono text-xs">
                      {inv.respondedAt
                        ? format(new Date(inv.respondedAt), "dd/MM/yyyy HH:mm")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
