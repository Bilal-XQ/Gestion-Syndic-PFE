"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Search, MoreHorizontal, Trash2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/features/shared/StatusBadge";
import { MeetingPanel } from "./meeting-panel";
import { DeleteMeetingDialog } from "./delete-meeting-dialog";

import { cancelMeeting } from "@/lib/actions/meetings";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate, formatTime } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Meeting = {
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

async function fetchMeetings(): Promise<Meeting[]> {
  const res = await fetch("/api/meetings");
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MeetingsTable() {
  const router = useRouter();
  const t = useTranslations("meetings");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
  });

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCancel(id: string) {
    const result = await cancelMeeting(id);
    if (result.success) {
      toast.success(t("table.cancelSuccess"));
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--text-muted]" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Button onClick={() => setPanelOpen(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("addButton")}
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-[--border-default] bg-[--bg-card]">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-[--border-default] hover:bg-transparent">
              <TableHead className="text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.title")}
              </TableHead>
              <TableHead className="text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.date")}
              </TableHead>
              <TableHead className="text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.time")}
              </TableHead>
              <TableHead className="text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.location")}
              </TableHead>
              <TableHead className="text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.status")}
              </TableHead>
              <TableHead className="text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.invitations")}
              </TableHead>
              <TableHead className="text-end text-[--text-muted] text-xs uppercase tracking-wider">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-[--text-muted]"
                >
                  {tc("loading")}
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-[--text-muted]"
                >
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((meeting) => (
                <TableRow
                  key={meeting.id}
                  className="border-[--border-default] hover:bg-[--bg-elevated]/50"
                >
                  <TableCell className="font-medium text-[--text-primary]">
                    {meeting.title}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[--text-secondary]">
                    {formatDate(meeting.meetingDate)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[--text-secondary]">
                    {formatTime(meeting.startTime)} — {formatTime(meeting.endTime)}
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    {meeting.location}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        meeting.status as
                          | "scheduled"
                          | "completed"
                          | "cancelled"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-[--text-secondary]">
                    <span className="font-mono">
                      {meeting.acceptedCount}/{meeting.totalInvitations}
                    </span>{" "}
                    {meeting.acceptedCount !== 1 ? t("table.accepted_other") : t("table.accepted_one")}
                  </TableCell>
                  <TableCell className="text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="border-[--border-default] bg-[--bg-elevated]"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/meetings/${meeting.id}`
                            )
                          }
                        >
                          <Eye className="me-2 h-4 w-4" />
                          {t("table.viewDetails")}
                        </DropdownMenuItem>
                        {meeting.status === "scheduled" && (
                          <DropdownMenuItem
                            onClick={() => handleCancel(meeting.id)}
                          >
                            <XCircle className="me-2 h-4 w-4" />
                            {t("table.cancel")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            setDeleteTarget({
                              id: meeting.id,
                              title: meeting.title,
                            })
                          }
                          className="text-[--status-error]"
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t("table.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      {/* Panels / Dialogs */}
      <MeetingPanel open={panelOpen} onOpenChange={setPanelOpen} />
      <DeleteMeetingDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        meetingId={deleteTarget?.id ?? null}
      />
    </>
  );
}
