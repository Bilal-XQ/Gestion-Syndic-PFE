"use client";

import { useTranslations } from "next-intl";

type Status =
  | "paid"
  | "partial"
  | "unpaid"
  | "occupied"
  | "vacant"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "accepted"
  | "declined"
  | "invited";

const statusColors: Record<Status, { color: string; bg: string }> = {
  paid: { color: "var(--status-success)", bg: "var(--status-success-bg)" },
  partial: { color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  unpaid: { color: "var(--status-error)", bg: "var(--status-error-bg)" },
  occupied: { color: "var(--status-success)", bg: "var(--status-success-bg)" },
  vacant: { color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  scheduled: { color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  completed: { color: "var(--status-success)", bg: "var(--status-success-bg)" },
  cancelled: { color: "var(--status-error)", bg: "var(--status-error-bg)" },
  accepted: { color: "var(--status-success)", bg: "var(--status-success-bg)" },
  declined: { color: "var(--status-error)", bg: "var(--status-error-bg)" },
  invited: { color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
};

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("common");
  const colors = statusColors[status];
  if (!colors) return null;

  return (
    <span
      className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
      style={{ color: colors.color, backgroundColor: colors.bg }}
    >
      {t(`status.${status}`)}
    </span>
  );
}
