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

const statusConfig: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  paid: { label: "Payé", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  partial: { label: "Partiel", color: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  unpaid: { label: "Impayé", color: "var(--status-error)", bg: "var(--status-error-bg)" },
  occupied: { label: "Occupé", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  vacant: { label: "Vacant", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  scheduled: { label: "Planifiée", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  completed: { label: "Terminée", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  cancelled: { label: "Annulée", color: "var(--status-error)", bg: "var(--status-error-bg)" },
  accepted: { label: "Acceptée", color: "var(--status-success)", bg: "var(--status-success-bg)" },
  declined: { label: "Refusée", color: "var(--status-error)", bg: "var(--status-error-bg)" },
  invited: { label: "Invité", color: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className="inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-medium"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}
