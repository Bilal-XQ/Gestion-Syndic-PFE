import { PaymentsTable } from "@/components/features/payments/payments-table";

export default function PaymentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[--text-primary]">
        Paiements
      </h1>
      <PaymentsTable />
    </div>
  );
}
