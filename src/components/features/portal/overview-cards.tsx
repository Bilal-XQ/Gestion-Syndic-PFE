"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Bell, Calendar, CreditCard } from "lucide-react";
import { formatDateLong, formatMAD } from "@/lib/formatters";
import type { OwnerMeetingRow } from "@/lib/db/queries/meetings";

type Charge = {
  remainingAmount: string;
};

type NotificationsResponse = {
  unreadCount: number;
};

export function OverviewCards() {
  const t = useTranslations("portal");

  const { data: charges = [] } = useQuery<Charge[]>({
    queryKey: ["portal", "charges"],
    queryFn: async () => {
      const r = await fetch("/api/portal/charges");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: meetings = [] } = useQuery<OwnerMeetingRow[]>({
    queryKey: ["portal", "meetings"],
    queryFn: async () => {
      const r = await fetch("/api/portal/meetings");
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: notifData } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await fetch("/api/notifications");
      if (!r.ok) return { unreadCount: 0 };
      return r.json();
    },
  });

  const totalRemaining = useMemo(
    () => charges.reduce((sum, c) => sum + Number(c.remainingAmount), 0),
    [charges]
  );

  const today = new Date().toISOString().split("T")[0];
  const nextMeeting = useMemo(
    () =>
      meetings
        .filter(
          (m) =>
            m.meetingDate >= today &&
            m.meetingStatus === "scheduled" &&
            m.invitationStatus !== "declined"
        )
        .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))[0] ?? null,
    [meetings, today]
  );

  const unreadCount = notifData?.unreadCount ?? 0;

  const cards = [
    {
      icon: CreditCard,
      label: t("overview.outstandingBalance"),
      value: formatMAD(totalRemaining),
      valueColor:
        totalRemaining > 0 ? "text-[--status-warning]" : "text-[--status-success]",
    },
    {
      icon: Calendar,
      label: t("overview.nextMeeting"),
      value: nextMeeting ? nextMeeting.title : t("overview.noUpcomingMeeting"),
      sub: nextMeeting ? formatDateLong(nextMeeting.meetingDate) : undefined,
      valueColor: nextMeeting ? "text-[--text-primary]" : "text-[--text-muted]",
    },
    {
      icon: Bell,
      label: t("overview.unreadNotifications"),
      value: String(unreadCount),
      valueColor: unreadCount > 0 ? "text-[--accent]" : "text-[--text-muted]",
    },
  ];

  return (
    <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-[--radius-xl] border border-[--border-subtle] bg-[--bg-card] px-5 py-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-4 w-4 text-[--text-muted]" />
              <p className="font-[family-name:var(--font-syne)] text-[11px] font-medium uppercase tracking-widest text-[--text-muted]">
                {card.label}
              </p>
            </div>
            <p
              className={`font-[family-name:var(--font-geist-mono)] text-[18px] font-semibold leading-snug ${card.valueColor}`}
            >
              {card.value}
            </p>
            {card.sub ? (
              <p className="mt-1 capitalize text-[12px] text-[--text-muted]">{card.sub}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
