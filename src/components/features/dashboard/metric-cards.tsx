import { Users, Building2, DoorOpen, KeyRound, Receipt, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/db/queries/dashboard";

const metricConfig = [
  {
    key: "totalOwners" as const,
    label: "Copropriétaires",
    icon: Users,
  },
  {
    key: "totalApartments" as const,
    label: "Appartements",
    icon: Building2,
  },
  {
    key: "occupiedApartments" as const,
    label: "Occupés",
    icon: KeyRound,
  },
  {
    key: "vacantApartments" as const,
    label: "Vacants",
    icon: DoorOpen,
  },
  {
    key: "totalCharges" as const,
    label: "Charges",
    icon: Receipt,
  },
  {
    key: "totalPayments" as const,
    label: "Paiements",
    icon: CreditCard,
  },
];

export function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metricConfig.map(({ key, label, icon: Icon }) => (
        <Card
          key={key}
          className="flex items-center gap-4 rounded-[20px] border-[--border-subtle] bg-[--bg-card] p-5"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-[--bg-surface]">
            <Icon className="size-5 text-[--text-muted]" />
          </div>
          <div>
            <p className="text-xl font-semibold text-[--text-primary]">
              {metrics[key]}
            </p>
            <p className="text-sm text-[--text-secondary]">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
