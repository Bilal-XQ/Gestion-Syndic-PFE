import { Users, Building2, DoorOpen, KeyRound, Receipt, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/db/queries/dashboard";

export async function MetricCards({ metrics }: { metrics: DashboardMetrics }) {
  const t = await getTranslations("dashboard");

  const metricConfig = [
    { key: "totalOwners" as const, label: t("metrics.owners"), icon: Users },
    { key: "totalApartments" as const, label: t("metrics.apartments"), icon: Building2 },
    { key: "occupiedApartments" as const, label: t("metrics.occupied"), icon: KeyRound },
    { key: "vacantApartments" as const, label: t("metrics.vacant"), icon: DoorOpen },
    { key: "totalCharges" as const, label: t("metrics.activeCharges"), icon: Receipt },
    { key: "totalPayments" as const, label: t("metrics.totalCollected"), icon: CreditCard },
  ];
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
