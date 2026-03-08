import { OwnerPaymentsView } from "@/components/features/payments/owner-payments-view";

export default function OwnerPaymentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Mes paiements
      </h1>
      <OwnerPaymentsView />
    </div>
  );
}
