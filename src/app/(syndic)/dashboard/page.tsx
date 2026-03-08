import { createClient } from "@/utils/supabase/server";
import { getDashboardMetrics } from "@/lib/db/queries/dashboard";
import { getOverdueCharges } from "@/lib/db/queries/charges";
import { getPaymentsGlobal, getMonthlyPaymentTotals, getFinancialSummary } from "@/lib/db/queries/payments";
import { MetricCardsGrid } from "@/components/features/dashboard/metric-cards-grid";
import { PaymentChart } from "@/components/features/dashboard/payment-chart";
import { RecentPayments } from "@/components/features/dashboard/recent-payments";
import { OverdueChargesTable } from "@/components/features/dashboard/overdue-charges-table";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const syndicId = user?.id ?? "";
  const syndicFirstName = user?.user_metadata?.first_name ?? user?.email ?? "";

  const emptyMetrics = {
    totalOwners: 0,
    totalApartments: 0,
    occupiedApartments: 0,
    vacantApartments: 0,
    totalCharges: 0,
    totalPayments: 0,
  };
  const emptyFinancial = {
    totalChargesIssued: "0",
    totalCollected: "0",
    totalOutstanding: "0",
  };

  const [metrics, monthlyPayments, allRecentPayments, overdueCharges, financialSummary] =
    await Promise.all([
      syndicId ? getDashboardMetrics(syndicId) : Promise.resolve(emptyMetrics),
      syndicId ? getMonthlyPaymentTotals(syndicId) : Promise.resolve([]),
      syndicId ? getPaymentsGlobal(syndicId) : Promise.resolve([]),
      syndicId ? getOverdueCharges(syndicId) : Promise.resolve([]),
      syndicId ? getFinancialSummary(syndicId) : Promise.resolve(emptyFinancial),
    ]);

  const recentPaymentsData = allRecentPayments.slice(-5).reverse();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue, {syndicFirstName}
          </p>
        </div>
      </div>

      {/* 6 metric cards */}
      <MetricCardsGrid metrics={metrics} financialSummary={financialSummary} />

      {/* Chart + Recent payments row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PaymentChart data={monthlyPayments} />
        </div>
        <div className="lg:col-span-1">
          <RecentPayments payments={recentPaymentsData} />
        </div>
      </div>

      {/* Overdue charges table */}
      <div>
        <h2 className="text-sm font-medium mb-3">Charges en retard</h2>
        <OverdueChargesTable charges={overdueCharges} />
      </div>
    </div>
  );
}
